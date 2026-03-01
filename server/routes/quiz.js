const express      = require('express')
const router       = express.Router()
const User         = require('../models/User')
const QuizAttempt  = require('../models/QuizAttempt')
const Question     = require('../models/Question')
const { authMiddleware } = require('../middleware/authMiddleware')
const { aiLimiter }     = require('../middleware/rateLimiter')
const { calculateQuizScore } = require('../services/difficultyEngine')
const { checkAndAwardBadges, updateStreak } = require('../services/badgeEngine')
const { generateQuizQuestions } = require('../services/geminiService')
const { syncOverallScore } = require('../utils/scoreSync')

const TOPICS = ['DSA', 'OS', 'DBMS', 'Networks', 'System Design', 'OOP', 'SQL', 'Aptitude', 'Verbal', 'HR']

// ─── Scheduled Test Slots (3 per day, 1-hour window each) ───────────────────
const TEST_SLOTS = [
  { id: 'morning',   label: 'Morning Test',   startHour: 9,  endHour: 10 },
  { id: 'afternoon', label: 'Afternoon Test',  startHour: 14, endHour: 15 },
  { id: 'evening',   label: 'Evening Test',    startHour: 19, endHour: 20 },
]

const QUESTIONS_PER_TEST  = 40
const QUESTIONS_PER_TOPIC = 4   // 4 × 10 topics = 40
const TEST_TIME_LIMIT     = 40 * 60  // 40 minutes in seconds

function todayKey() { return new Date().toISOString().slice(0, 10) }

function fmtHour(h) {
  const suffix = h >= 12 ? 'PM' : 'AM'
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${display}:00 ${suffix}`
}

function getSlotStatus() {
  const now  = new Date()
  const hour = now.getHours()
  const min  = now.getMinutes()

  return TEST_SLOTS.map(slot => {
    const isOpen = hour >= slot.startHour && hour < slot.endHour
    const isPast = hour >= slot.endHour
    let opensIn = null
    if (!isOpen && !isPast) opensIn = (slot.startHour - hour) * 60 - min
    return {
      ...slot,
      isOpen,
      isPast,
      opensIn,
      timeRange: `${fmtHour(slot.startHour)} - ${fmtHour(slot.endHour)}`,
    }
  })
}

// ─── GET /schedule — today's slots + user attempt status ─────────────────────
router.get('/schedule', authMiddleware, async (req, res) => {
  try {
    const user  = await User.findOne({ uid: req.user.uid })
    const slots = getSlotStatus()
    const today = todayKey()
    const dayStart = new Date(today + 'T00:00:00')
    const dayEnd   = new Date(today + 'T23:59:59')

    const todayAttempts = user
      ? await QuizAttempt.find({
          userId: user._id,
          slotId: { $exists: true, $ne: null },
          completedAt: { $gte: dayStart, $lte: dayEnd },
        }).select('slotId score completedAt').lean()
      : []

    const attemptMap = {}
    todayAttempts.forEach(a => { attemptMap[a.slotId] = a })

    const schedule = slots.map(s => ({
      ...s,
      attempted: !!attemptMap[s.id],
      score:     attemptMap[s.id]?.score ?? null,
      attemptId: attemptMap[s.id]?._id ?? null,
    }))

    res.json({ schedule, attemptsToday: todayAttempts.length, maxPerDay: 3, date: today })
  } catch (err) {
    console.error('Schedule error:', err)
    res.json({ schedule: getSlotStatus(), attemptsToday: 0, maxPerDay: 3, date: todayKey() })
  }
})

// ─── POST /start — begin a scheduled test ────────────────────────────────────
router.post('/start', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const { slotId } = req.body
    if (!slotId) return res.status(400).json({ message: 'Slot ID is required' })

    const slot = TEST_SLOTS.find(s => s.id === slotId)
    if (!slot) return res.status(400).json({ message: 'Invalid test slot' })

    // Enforce time window
    const hour = new Date().getHours()
    if (hour < slot.startHour || hour >= slot.endHour) {
      return res.status(403).json({
        message: `This test is only available between ${fmtHour(slot.startHour)} and ${fmtHour(slot.endHour)}.`
      })
    }

    // Enforce one attempt per slot per day
    const today    = todayKey()
    const dayStart = new Date(today + 'T00:00:00')
    const dayEnd   = new Date(today + 'T23:59:59')
    const existing = await QuizAttempt.findOne({
      userId: user._id, slotId,
      completedAt: { $gte: dayStart, $lte: dayEnd },
    })
    if (existing) {
      return res.status(403).json({ message: 'You already completed this test today. Try the next slot!' })
    }

    // Adaptive difficulty from last 5 attempts
    const recent = await QuizAttempt.find({ userId: user._id })
      .sort({ completedAt: -1 }).limit(5).select('score').lean()
    const avg = recent.length > 0
      ? recent.reduce((s, a) => s + a.score, 0) / recent.length : 0
    const difficulty = avg >= 80 ? 'hard' : avg >= 50 ? 'medium' : 'easy'

    // Build 40 questions — 4 per topic from Question bank
    let allQuestions = []
    for (const topic of TOPICS) {
      const qs = await Question.aggregate([
        { $match: { topic, difficulty, isActive: { $ne: false } } },
        { $sample: { size: QUESTIONS_PER_TOPIC } },
      ])
      if (qs.length < QUESTIONS_PER_TOPIC) {
        const fill = await Question.aggregate([
          { $match: { topic, isActive: { $ne: false }, _id: { $nin: qs.map(q => q._id) } } },
          { $sample: { size: QUESTIONS_PER_TOPIC - qs.length } },
        ])
        qs.push(...fill)
      }
      allQuestions.push(...qs)
    }

    // Fallback: Gemini if DB is sparse
    if (allQuestions.length < 20) {
      try {
        const userProfile = {
          targetRole: user.targetRole, year: user.year, branch: user.branch,
          targetCompanies: user.targetCompanies, skills: user.skills,
        }
        const aiQs = await generateQuizQuestions('Mixed', difficulty, QUESTIONS_PER_TEST, userProfile)
        if (Array.isArray(aiQs)) {
          for (const q of aiQs) {
            try {
              const doc = await Question.create({
                topic: q.subtopic || 'Mixed', subtopic: q.subtopic || 'General',
                difficulty, type: 'mcq_single', question: q.question,
                options: q.options, correct: q.correct, explanation: q.explanation,
                tags: ['mixed'],
              })
              allQuestions.push(doc)
            } catch { /* skip */ }
          }
        }
      } catch (e) {
        console.warn('Gemini fallback failed:', e.message?.slice(0, 100))
      }
    }

    if (allQuestions.length === 0) {
      return res.status(503).json({ message: 'No questions available. Please try again shortly.' })
    }

    // Shuffle
    for (let i = allQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]]
    }

    const selected = allQuestions.slice(0, QUESTIONS_PER_TEST)
    const clientQuestions = selected.map(q => ({
      _id: q._id, question: q.question, options: q.options,
      correct: q.correct, explanation: q.explanation,
      type: q.type || 'mcq_single', topic: q.topic || 'Mixed',
      difficulty: q.difficulty || difficulty, points: q.points || 10,
    }))

    res.json({
      questions: clientQuestions, slotId, slotLabel: slot.label,
      difficulty, totalQuestions: clientQuestions.length,
      timeLimit: TEST_TIME_LIMIT,
    })
  } catch (err) {
    console.error('Quiz start error:', err)
    const is429 = err.message?.includes('429') || err.message?.includes('quota')
    if (is429) return res.status(429).json({ message: 'AI quota exceeded. Please wait and retry.' })
    res.status(500).json({ message: 'Failed to start test: ' + err.message })
  }
})

// ─── POST /submit — submit test answers ──────────────────────────────────────
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { questionIds, answers, slotId, timeTaken, violations = 0 } = req.body
    const user = await User.findOne({ uid: req.user.uid })

    const isTemp = questionIds.some(id => String(id).startsWith('temp_'))
    let questions
    if (isTemp) {
      questions = questionIds.map((id, i) => ({ _id: id, question: `Q${i+1}`, correct: answers[i], options: [] }))
    } else {
      questions = await Question.find({ _id: { $in: questionIds } }).lean()
    }

    const { results, score, correct, incorrect, skipped } = calculateQuizScore(questions, answers)

    // Per-topic breakdown
    const topicBreakdown = {}
    results.forEach(r => {
      const t = r.topic || 'Mixed'
      if (!topicBreakdown[t]) topicBreakdown[t] = { correct: 0, total: 0 }
      topicBreakdown[t].total++
      if (r.isCorrect) topicBreakdown[t].correct++
    })

    const weakTopics = Object.entries(topicBreakdown)
      .filter(([, v]) => v.total > 0 && (v.correct / v.total) < 0.5)
      .map(([t]) => t)

    let aiInsight
    if (score < 50) {
      aiInsight = `You scored ${score}%. Focus on: ${weakTopics.join(', ') || 'fundamentals'}. Difficulty will adjust down next time.`
    } else if (score < 80) {
      aiInsight = `Good effort — ${score}%! ${weakTopics.length ? `Revise: ${weakTopics.join(', ')}.` : 'Solid across topics.'} Score above 80% to advance.`
    } else {
      aiInsight = `Excellent ${score}%! Strong performance. Difficulty will increase next time.`
    }

    const attempt = new QuizAttempt({
      userId: user._id, userUid: user.uid,
      topic: 'Scheduled Test',
      slotId: slotId || undefined,
      difficulty: questions[0]?.difficulty || 'medium',
      questions: results.map(q => ({
        questionId: q._id?.toString(), question: q.question,
        userAnswer: q.userAnswer, correct: q.correct,
        isCorrect: q.isCorrect, explanation: q.explanation,
      })),
      score, correctCount: correct, incorrectCount: incorrect,
      skippedCount: skipped, totalQuestions: questions.length,
      timeTaken, violations, aiInsight,
    })
    await attempt.save()

    // Update user quiz score
    const prevScore = user.scores?.quiz || 0
    const newScore  = Math.round(prevScore * 0.7 + score * 0.3)
    await User.updateOne({ uid: req.user.uid }, { 'scores.quiz': newScore })
    await syncOverallScore(req.user.uid)
    await updateStreak(user._id)
    const newBadges = await checkAndAwardBadges(user._id, user.uid)

    res.json({ attempt, score, correct, incorrect, skipped, results, topicBreakdown, newBadges })
  } catch (err) {
    console.error('Quiz submit error:', err)
    res.status(500).json({ message: err.message })
  }
})

// ─── GET /history ────────────────────────────────────────────────────────────
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid })
    const history = await QuizAttempt.find({ userId: user._id })
      .select('-questions')
      .sort({ completedAt: -1 })
      .limit(20)
    res.json({ history })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── GET /topics (backward compat) ──────────────────────────────────────────
router.get('/topics', authMiddleware, async (_req, res) => {
  res.json({ topics: TOPICS.map(t => ({ topic: t })) })
})

// ─── GET /:quizId ────────────────────────────────────────────────────────────
router.get('/:quizId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid })
    const quiz = await QuizAttempt.findOne({ _id: req.params.quizId, userId: user._id })
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' })
    res.json({ quiz })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

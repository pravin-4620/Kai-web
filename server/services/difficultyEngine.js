const QuizAttempt = require('../models/QuizAttempt')
const Question    = require('../models/Question')

const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard']

// Adaptive difficulty selection
const getAdaptiveDifficulty = async (userId, topic) => {
  try {
    // Get last 3 attempts for this topic
    const recentAttempts = await QuizAttempt.find({ userId, topic })
      .sort({ completedAt: -1 })
      .limit(3)
      .select('score difficulty')

    if (recentAttempts.length === 0) return 'easy'

    const avgScore = recentAttempts.reduce((s, a) => s + a.score, 0) / recentAttempts.length

    if (avgScore >= 80) {
      // Bump up difficulty
      const currentDiff = recentAttempts[0].difficulty || 'easy'
      const currentIdx = DIFFICULTY_LEVELS.indexOf(currentDiff)
      return DIFFICULTY_LEVELS[Math.min(currentIdx + 1, 2)]
    } else if (avgScore >= 60) {
      return recentAttempts[0].difficulty || 'medium'
    } else {
      // Drop difficulty
      const currentDiff = recentAttempts[0].difficulty || 'medium'
      const currentIdx = DIFFICULTY_LEVELS.indexOf(currentDiff)
      return DIFFICULTY_LEVELS[Math.max(currentIdx - 1, 0)]
    }
  } catch {
    return 'easy'
  }
}

// Get quiz questions with exclusions
const getQuizQuestions = async (topic, difficulty, count = 10, userId) => {
  try {
    // Get recently seen question IDs (last 7 days)
    const seenAttempts = await QuizAttempt.find({
      userId,
      completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }).select('questions.questionId')

    const seenIds = seenAttempts
      .flatMap(a => a.questions?.map(q => q.questionId) || [])
      .filter(Boolean)

    const query = {
      topic,
      difficulty,
      isActive: true,
      _id:      { $nin: seenIds },
    }

    let questions = await Question.find(query)
      .limit(count)
      .lean()

    // If not enough unique questions, allow repeats
    if (questions.length < count) {
      const additional = await Question.find({ topic, difficulty, isActive: true })
        .limit(count - questions.length)
        .lean()
      questions = [...questions, ...additional]
    }

    // Shuffle
    return questions.sort(() => Math.random() - 0.5).slice(0, count)
  } catch {
    return []
  }
}

// Calculate quiz score
const calculateQuizScore = (questions, userAnswers) => {
  let correct = 0
  let incorrect = 0
  let skipped = 0

  const results = questions.map((q, i) => {
    const userAns = userAnswers[i]
    if (!userAns) {
      skipped++
      return { ...q, userAnswer: null, isCorrect: false }
    }
    const isCorrect = String(userAns).toLowerCase() === String(q.correct).toLowerCase()
    if (isCorrect) correct++
    else incorrect++
    return { ...q, userAnswer: userAns, isCorrect }
  })

  const score = Math.round((correct / questions.length) * 100)
  return { results, score, correct, incorrect, skipped }
}

module.exports = { getAdaptiveDifficulty, getQuizQuestions, calculateQuizScore }

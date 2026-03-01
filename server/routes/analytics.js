const express      = require('express')
const router       = express.Router()
const User         = require('../models/User')
const TestAttempt  = require('../models/TestAttempt')
const QuizAttempt  = require('../models/QuizAttempt')
const FocusSession = require('../models/FocusSession')
const { authMiddleware } = require('../middleware/authMiddleware')
const { aiLimiter }      = require('../middleware/rateLimiter')
const { generateInsights } = require('../services/geminiService')

// Overview analytics
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).lean()

    const [testCount, quizCount, interviews, focusHours] = await Promise.all([
      TestAttempt.countDocuments({ userId: user._id }),
      QuizAttempt.countDocuments({ userId: user._id }),
      TestAttempt.countDocuments({ userId: user._id, 'aiEvaluation.overallGrade': { $in: ['A+', 'A'] } }),
      FocusSession.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: null, total: { $sum: '$duration' } } },
      ]),
    ])

    const totalFocusHours = focusHours[0]?.total || 0

    res.json({
      overallScore:  user.overallScore || 0,
      currentGrade:  user.currentGrade || 'D',
      streak:        user.streak || 0,
      badges:        user.badges || [],
      sprintDay:     user.sprintDay || 1,
      scores:        user.scores || {},
      stats: {
        testsCompleted: testCount,
        quizzesCompleted: quizCount,
        topGrades: interviews,
        focusHours: Math.round(totalFocusHours / 60),
      },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Daily scores for line chart
router.get('/daily-scores', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).lean()
    const startDate = new Date(user.sprintStartDate || Date.now())

    const attempts = await TestAttempt.find({
      userId:      user._id,
      submittedAt: { $gte: startDate },
    }).select('submittedAt passRate aiEvaluation.correctnessScore').sort({ submittedAt: 1 }).lean()

    const quizzes = await QuizAttempt.find({
      userId:      user._id,
      completedAt: { $gte: startDate },
    }).select('completedAt score').sort({ completedAt: 1 }).lean()

    // Build 7-day data
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dayAttempts = attempts.filter(a => {
        const d = new Date(a.submittedAt)
        return d.toDateString() === date.toDateString()
      })
      const dayQuizzes = quizzes.filter(q => {
        const d = new Date(q.completedAt)
        return d.toDateString() === date.toDateString()
      })
      const codingScore = dayAttempts.length > 0
        ? dayAttempts.reduce((s, a) => s + (a.aiEvaluation?.correctnessScore || 0), 0) / dayAttempts.length : null
      const quizScore = dayQuizzes.length > 0
        ? dayQuizzes.reduce((s, q) => s + q.score, 0) / dayQuizzes.length : null
      return { day: i + 1, date: date.toISOString().split('T')[0], codingScore, quizScore, overallScore: user.overallScore }
    })

    res.json({ days })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Topic-wise performance
router.get('/topics', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).lean()
    const quizByTopic = await QuizAttempt.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: '$topic', avgScore: { $avg: '$score' }, count: { $sum: 1 } } },
      { $sort: { avgScore: -1 } },
    ])
    res.json({ topics: quizByTopic })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// AI insights
router.get('/insights', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).lean()
    const insights = await generateInsights(user)
    res.json({ insights })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Activity heatmap
router.get('/heatmap', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).lean()
    const since = new Date()
    since.setDate(since.getDate() - 30)

    const testsByDay = await TestAttempt.aggregate([
      { $match: { userId: user._id, submittedAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } }, count: { $sum: 1 } } },
    ])
    const quizByDay = await QuizAttempt.aggregate([
      { $match: { userId: user._id, completedAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, count: { $sum: 1 } } },
    ])

    const heatmap = {}
    testsByDay.forEach(d => { heatmap[d._id] = (heatmap[d._id] || 0) + d.count })
    quizByDay.forEach(d => { heatmap[d._id] = (heatmap[d._id] || 0) + d.count })

    res.json({ heatmap })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

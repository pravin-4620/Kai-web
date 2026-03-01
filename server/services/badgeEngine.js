const User = require('../models/User')
const TestAttempt = require('../models/TestAttempt')
const QuizAttempt = require('../models/QuizAttempt')
const InterviewSession = require('../models/InterviewSession')

const BADGE_DEFINITIONS = {
  first_blood:       { emoji: '🚀', name: 'First Blood',          desc: 'Complete first coding test' },
  on_fire:           { emoji: '🔥', name: 'On Fire',              desc: '3-day streak' },
  diamond_coder:     { emoji: '💎', name: 'Diamond Coder',        desc: 'Score A+ on 3 coding tests' },
  quiz_master:       { emoji: '🧠', name: 'Quiz Master',          desc: 'Score 90%+ on 5 quizzes' },
  resume_pro:        { emoji: '📄', name: 'Resume Pro',           desc: 'ATS Score > 85' },
  interview_ready:   { emoji: '🎤', name: 'Interview Ready',      desc: 'Complete mock interview' },
  top_10:            { emoji: '🌍', name: 'Top 10',               desc: 'Reach top 10 in institution' },
  speed_demon:       { emoji: '⚡', name: 'Speed Demon',          desc: 'Solve problem in under 5 mins' },
  warrior_7day:      { emoji: '🎯', name: '7-Day Warrior',        desc: 'Complete all 7-day tasks' },
  institution_champ: { emoji: '🏆', name: 'Institution Champion', desc: '#1 rank in institution' },
}

// Check and award badges after any action
const checkAndAwardBadges = async (userId, userUid) => {
  try {
    const user = await User.findById(userId)
    if (!user) return []

    const newBadges = []
    const existingBadges = new Set(user.badges || [])

    // First Blood — first coding test
    if (!existingBadges.has('first_blood')) {
      const testCount = await TestAttempt.countDocuments({ userId })
      if (testCount >= 1) newBadges.push('first_blood')
    }

    // On Fire — 3-day streak
    if (!existingBadges.has('on_fire') && user.streak >= 3) {
      newBadges.push('on_fire')
    }

    // Diamond Coder — A+ on 3 coding tests
    if (!existingBadges.has('diamond_coder')) {
      const aptests = await TestAttempt.countDocuments({
        userId,
        'aiEvaluation.overallGrade': 'A+',
      })
      if (aptests >= 3) newBadges.push('diamond_coder')
    }

    // Quiz Master — 90%+ on 5 quizzes
    if (!existingBadges.has('quiz_master')) {
      const topQuizzes = await QuizAttempt.countDocuments({ userId, score: { $gte: 90 } })
      if (topQuizzes >= 5) newBadges.push('quiz_master')
    }

    // Resume Pro — ATS > 85
    if (!existingBadges.has('resume_pro') && (user.scores?.resume || 0) >= 85) {
      newBadges.push('resume_pro')
    }

    // Interview Ready — completed mock interview
    if (!existingBadges.has('interview_ready')) {
      const interview = await InterviewSession.findOne({ userId, status: 'completed' })
      if (interview) newBadges.push('interview_ready')
    }

    // Speed Demon — solve in under 5 mins
    if (!existingBadges.has('speed_demon')) {
      const fast = await TestAttempt.findOne({ userId, timeTaken: { $lt: 300 }, 'aiEvaluation.overallGrade': { $in: ['A+', 'A', 'B+'] } })
      if (fast) newBadges.push('speed_demon')
    }

    if (newBadges.length > 0) {
      await User.updateOne(
        { _id: userId },
        { $addToSet: { badges: { $each: newBadges } } }
      )
    }

    return newBadges.map(key => ({ key, ...BADGE_DEFINITIONS[key] }))
  } catch (err) {
    console.error('Badge engine error:', err.message)
    return []
  }
}

// Update streak
const updateStreak = async (userId) => {
  const user = await User.findById(userId)
  if (!user) return

  const now = new Date()
  const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null
  const diffDays = lastActive
    ? Math.floor((now - lastActive) / 86400000)
    : 999

  if (diffDays === 0) return // Same day, no change
  if (diffDays === 1) {
    // Consecutive day — increment streak
    await User.updateOne({ _id: userId }, { $inc: { streak: 1 }, lastActiveDate: now })
  } else {
    // Streak broken
    await User.updateOne({ _id: userId }, { streak: 1, lastActiveDate: now })
  }
}

module.exports = { checkAndAwardBadges, updateStreak, BADGE_DEFINITIONS }

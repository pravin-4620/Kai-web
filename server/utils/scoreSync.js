const User = require('../models/User')
const { calculateOverallScore, getGrade } = require('./gradeCalculator')

/**
 * Recalculate and persist overallScore + currentGrade for a given user UID.
 * Call this after any individual score (coding, quiz, interview, etc.) is updated.
 */
async function syncOverallScore(uid) {
  try {
    const user = await User.findOne({ uid }).select('scores streak').lean()
    if (!user) return
    const overall = calculateOverallScore({
      coding:     user.scores?.coding     || 0,
      quiz:       user.scores?.quiz       || 0,
      interview:  user.scores?.interview  || 0,
      softSkills: user.scores?.softSkills || 0,
      resume:     user.scores?.resume     || 0,
      streak:     user.streak             || 0,
    })
    const grade = getGrade(overall)
    await User.updateOne({ uid }, { overallScore: overall, currentGrade: grade.grade })
    return overall
  } catch (err) {
    console.error('syncOverallScore error:', err.message)
  }
}

module.exports = { syncOverallScore }

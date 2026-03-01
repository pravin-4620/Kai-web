const express = require('express')
const router  = express.Router()
const User    = require('../models/User')
const { authMiddleware } = require('../middleware/authMiddleware')
const { aiLimiter }      = require('../middleware/rateLimiter')
const { evaluateSoftSkill } = require('../services/geminiService')
const { checkAndAwardBadges } = require('../services/badgeEngine')
const { syncOverallScore } = require('../utils/scoreSync')

const MODULES = [
  { id: 'communication',   title: 'Communication Mastery',   icon: '💬', description: 'Master verbal and written communication', order: 1 },
  { id: 'emailEtiquette',  title: 'Email Etiquette',         icon: '📧', description: 'Write professional emails', order: 2 },
  { id: 'starMethod',      title: 'STAR Method',             icon: '⭐', description: 'Structure behavioral answers', order: 3 },
  { id: 'bodyLanguage',    title: 'Body Language & Presence', icon: '🧍', description: 'Present yourself confidently', order: 4 },
  { id: 'negotiation',     title: 'Negotiation Basics',      icon: '🤝', description: 'Negotiate offers effectively', order: 5 },
  { id: 'linkedin',        title: 'LinkedIn Optimization',   icon: '💼', description: 'Optimize your LinkedIn profile', order: 6 },
  { id: 'presentation',    title: 'Presentation Skills',     icon: '🎤', description: 'Deliver compelling pitches', order: 7 },
]

router.get('/modules', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).select('softSkillsProgress').lean()
    const modulesWithProgress = MODULES.map(m => ({
      ...m,
      progress: user.softSkillsProgress?.[m.id] || 0,
      isUnlocked: m.order === 1 || (user.softSkillsProgress?.[MODULES[m.order - 2]?.id] || 0) >= 60,
    }))
    res.json({ modules: modulesWithProgress })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/submit', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const { moduleId, response: userResponse, context } = req.body
    const user = await User.findOne({ uid: req.user.uid })

    const feedback = await evaluateSoftSkill(moduleId, userResponse, context || '')

    // Update module progress
    const prevProgress = user.softSkillsProgress?.[moduleId] || 0
    const newProgress  = Math.max(prevProgress, feedback.score || 70)
    await User.updateOne(
      { uid: req.user.uid },
      { $set: { [`softSkillsProgress.${moduleId}`]: newProgress } }
    )

    // Recalculate soft skills score
    const updatedUser = await User.findOne({ uid: req.user.uid })
    const allProgress = Object.values(updatedUser.softSkillsProgress?.toObject?.() || {})
    const avgProgress = allProgress.length > 0
      ? allProgress.reduce((a, b) => a + b, 0) / allProgress.length
      : 0
    await User.updateOne({ uid: req.user.uid }, { 'scores.softSkills': Math.round(avgProgress) })
    await syncOverallScore(req.user.uid)

    const newBadges = await checkAndAwardBadges(user._id, user.uid)
    res.json({ feedback, newProgress, newBadges })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/progress', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).select('softSkillsProgress scores.softSkills').lean()
    res.json({ progress: user.softSkillsProgress, overallScore: user.scores?.softSkills || 0 })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

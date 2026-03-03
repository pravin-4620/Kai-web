const express  = require('express')
const router   = express.Router()
const mongoose = require('mongoose')
const User     = require('../models/User')
const { authMiddleware } = require('../middleware/authMiddleware')
const { aiLimiter }      = require('../middleware/rateLimiter')
const { evaluateSoftSkill, generateSoftSkillReport } = require('../services/geminiService')
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

// ─── Voice Session: Start ─────────────────────────────────────────────────────
router.post('/start-voice', authMiddleware, async (req, res) => {
  try {
    const { moduleId } = req.body
    const user = await User.findOne({ uid: req.user.uid })
    if (!user) return res.status(404).json({ message: 'User not found' })
    // Create a lightweight session object (stateless for voice)
    const session = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId: user._id,
      userUid: user.uid,
      moduleId: moduleId || 'communication',
      status: 'active',
      createdAt: new Date(),
    }
    res.status(201).json({ session })
  } catch (err) {
    console.error('start-voice error:', err)
    res.status(500).json({ message: err.message })
  }
})

// ─── Voice Session: End & Generate Report ─────────────────────────────────────
router.post('/end-voice/:sessionId', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const { transcript } = req.body
    const user = await User.findOne({ uid: req.user.uid })
    const moduleId = req.body.moduleId || 'communication'

    let report
    if (Array.isArray(transcript) && transcript.length > 0) {
      const messages = transcript.map(t => ({
        role: t.role === 'user' ? 'user' : 'coach',
        content: t.content || '',
      }))

      try {
        report = await generateSoftSkillReport(messages, moduleId)
      } catch (aiErr) {
        console.warn('AI soft skill report failed, using fallback:', aiErr.message?.slice(0, 120))
        const userMsgs = messages.filter(m => m.role === 'user')
        const avgLen = userMsgs.reduce((s, m) => s + (m.content?.length || 0), 0) / (userMsgs.length || 1)
        const baseScore = Math.min(70, Math.round(30 + (userMsgs.length * 5) + (avgLen > 80 ? 15 : avgLen > 40 ? 8 : 0)))
        report = {
          overallScore: baseScore,
          communication: baseScore,
          clarity: Math.max(20, baseScore - 5),
          professionalism: Math.min(85, baseScore + 5),
          confidence: baseScore,
          relevance: baseScore,
          strengths: ['Completed the practice session', userMsgs.length >= 4 ? 'Engaged with multiple scenarios' : 'Participated actively'],
          improvements: ['AI analysis temporarily unavailable — try again for detailed feedback'],
          tips: ['Practice with a friend for real-time feedback'],
          summary: 'Session completed. Retake for a more detailed AI analysis.',
        }
      }
    } else {
      report = {
        overallScore: 0, communication: 0, clarity: 0, professionalism: 0, confidence: 0, relevance: 0,
        strengths: [], improvements: ['No conversation captured. Ensure your microphone is working.'], tips: [],
        summary: 'No conversation was recorded.',
      }
    }

    // Update module progress
    const prevProgress = user.softSkillsProgress?.[moduleId] || 0
    const newProgress = Math.max(prevProgress, report.overallScore || 0)
    await User.updateOne(
      { uid: req.user.uid },
      { $set: { [`softSkillsProgress.${moduleId}`]: newProgress } }
    )

    // Recalculate overall soft skills score
    const updatedUser = await User.findOne({ uid: req.user.uid })
    const allProgress = Object.values(updatedUser.softSkillsProgress?.toObject?.() || {})
    const avgProgress = allProgress.length > 0
      ? allProgress.reduce((a, b) => a + b, 0) / allProgress.length
      : 0
    await User.updateOne({ uid: req.user.uid }, { 'scores.softSkills': Math.round(avgProgress) })
    await syncOverallScore(req.user.uid)

    const newBadges = await checkAndAwardBadges(user._id, user.uid)
    res.json({ report, newProgress, newBadges })
  } catch (err) {
    console.error('soft-skills end-voice error:', err)
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

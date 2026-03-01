const express  = require('express')
const router   = express.Router()
const Resume   = require('../models/Resume')
const User     = require('../models/User')
const { authMiddleware } = require('../middleware/authMiddleware')
const { aiLimiter }      = require('../middleware/rateLimiter')
const { scoreATS }       = require('../services/atsScorer')
const { improveBullet, generateResumeSummary, compareResumeWithJD } = require('../services/geminiService')
const { checkAndAwardBadges } = require('../services/badgeEngine')
const { syncOverallScore } = require('../utils/scoreSync')

// Helper: convert structured resume object → plain text for ATS scoring
function resumeToText(resumeData) {
  if (!resumeData || typeof resumeData === 'string') return resumeData || ''
  const parts = []
  const pi = resumeData.personalInfo || {}
  if (pi.name)     parts.push(pi.name)
  if (pi.email)    parts.push(pi.email)
  if (pi.phone)    parts.push(pi.phone)
  if (pi.location) parts.push(pi.location)
  if (resumeData.summary) parts.push(resumeData.summary)
  if (Array.isArray(resumeData.skills)) parts.push(resumeData.skills.join(', '))
  if (Array.isArray(resumeData.experience)) {
    resumeData.experience.forEach(exp => {
      if (exp.role)    parts.push(exp.role)
      if (exp.company) parts.push(exp.company)
      if (Array.isArray(exp.bullets)) parts.push(exp.bullets.join(' '))
    })
  }
  if (Array.isArray(resumeData.education)) {
    resumeData.education.forEach(edu => {
      if (edu.degree) parts.push(edu.degree)
      if (edu.school) parts.push(edu.school)
    })
  }
  if (Array.isArray(resumeData.projects)) {
    resumeData.projects.forEach(p => {
      if (p.name) parts.push(p.name)
      if (p.description) parts.push(p.description)
    })
  }
  return parts.join('\n')
}

// Get user's active resume
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const user   = await User.findOne({ uid: req.user.uid })
    const resume = await Resume.findOne({ userId: user._id, isActive: true }).sort({ updatedAt: -1 })
    res.json({ resume })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Save resume
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid })
    const { data, resumeData, template } = req.body
    const resumeContent = data || resumeData

    let resume = await Resume.findOne({ userId: user._id, isActive: true })
    if (resume) {
      resume.data     = resumeContent
      resume.template = template || resume.template
      resume.lastSaved = new Date()
    } else {
      resume = new Resume({ userId: user._id, userUid: user.uid, data: resumeContent, template: template || 'classic' })
    }
    await resume.save()
    res.json({ resume })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Score resume with ATS
router.post('/score', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const { text, resumeData, role } = req.body
    const user = await User.findOne({ uid: req.user.uid })
    const resumeText = text || resumeToText(resumeData)

    const result = await scoreATS(resumeText, role || user.targetRole)

    // Save score to resume
    await Resume.findOneAndUpdate(
      { userId: user._id, isActive: true },
      { atsScore: result.overallScore, atsDetails: result }
    )

    // Update user score
    await User.updateOne({ uid: req.user.uid }, { 'scores.resume': result.overallScore })
    await syncOverallScore(req.user.uid)

    // Check for Resume Pro badge
    const newBadges = await checkAndAwardBadges(user._id, user.uid)

    res.json({ ...result, newBadges })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Improve bullet point
router.post('/improve', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const { bullet, role, context } = req.body
    const user = await User.findOne({ uid: req.user.uid })
    const result = await improveBullet(bullet, role || context || user.targetRole)
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Generate summary
router.post('/summary', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid })
    const result = await generateResumeSummary({
      targetRole:      req.body.targetRole || user.targetRole,
      skills:          user.skills,
      year:            user.year,
      branch:          user.branch,
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Compare with JD
router.post('/compare-jd', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const { resumeText, jd } = req.body
    const result = await compareResumeWithJD(resumeText, jd)
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get version history
router.get('/versions', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid })
    const versions = await Resume.find({ userId: user._id })
      .select('version template atsScore lastSaved createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
    res.json({ versions })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

const express  = require('express')
const router   = express.Router()
const multer   = require('multer')
const { PDFParse } = require('pdf-parse')
const Resume   = require('../models/Resume')
const User     = require('../models/User')
const { authMiddleware } = require('../middleware/authMiddleware')
const { aiLimiter }      = require('../middleware/rateLimiter')
const { scoreATS }       = require('../services/atsScorer')
const { improveBullet, generateResumeSummary, compareResumeWithJD, analyzeResumePDF } = require('../services/geminiService')
const { checkAndAwardBadges } = require('../services/badgeEngine')
const { syncOverallScore } = require('../utils/scoreSync')

// Multer config — accept PDF up to 5MB, keep in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true)
    else cb(new Error('Only PDF files are allowed'), false)
  },
})

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

// ─── Upload PDF & Analyze ─────────────────────────────────────────────────────
router.post('/analyze', authMiddleware, upload.single('resume'), aiLimiter, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' })
    }

    // Extract text from PDF (pdf-parse v2 API)
    const parser = new PDFParse({ data: req.file.buffer, verbosity: 0 })
    const pdfData = await parser.getText()
    const resumeText = pdfData.text?.trim()

    if (!resumeText || resumeText.length < 50) {
      return res.status(400).json({ message: 'Could not extract text from this PDF. Please ensure it is not image-based.' })
    }

    const user = await User.findOne({ uid: req.user.uid })
    const targetRole = req.body.targetRole || user.targetRole || 'Software Engineer'

    // Run AI analysis
    const analysis = await analyzeResumePDF(resumeText, targetRole)

    // Also run local ATS scoring for hybrid results
    const atsResult = await scoreATS(resumeText, targetRole)

    // Merge: prefer AI analysis but use local as fallback
    const result = {
      atsScore:          analysis.atsScore || atsResult.overallScore || 0,
      sectionScores:     analysis.sectionScores || {},
      strengths:         analysis.strengths || atsResult.strengths || [],
      criticalIssues:    analysis.criticalIssues || [],
      suggestions:       analysis.suggestions || atsResult.suggestions?.map(s => ({ priority: 'medium', category: 'general', text: s })) || [],
      missingKeywords:   analysis.missingKeywords || atsResult.missingKeywords || [],
      presentKeywords:   analysis.presentKeywords || atsResult.presentKeywords || [],
      actionVerbs:       analysis.actionVerbs || { found: [], suggested: [] },
      quantificationCheck: analysis.quantificationCheck || { hasMetrics: false, examples: [] },
      overallFeedback:   analysis.overallFeedback || '',
      resumeText,
      wordCount:         resumeText.split(/\s+/).length,
      pageCount:         pdfData.total || 1,
    }

    // Save score to user
    await User.updateOne({ uid: req.user.uid }, { 'scores.resume': result.atsScore })
    await syncOverallScore(req.user.uid)

    // Check badges
    const newBadges = await checkAndAwardBadges(user._id, user.uid)

    res.json({ ...result, newBadges })
  } catch (err) {
    console.error('Resume analyze error:', err.message)
    if (err.message === 'Only PDF files are allowed') {
      return res.status(400).json({ message: err.message })
    }
    const isQuota = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('Too Many Requests')
    if (isQuota) {
      return res.status(429).json({ message: 'AI service is temporarily rate-limited. Please wait a minute and try again.' })
    }
    res.status(500).json({ message: 'Failed to analyze resume. Please try again.' })
  }
})

// ─── Analyze pasted text (no file upload) ─────────────────────────────────────
router.post('/analyze-text', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const { text, targetRole: role } = req.body
    if (!text || text.trim().length < 50) {
      return res.status(400).json({ message: 'Resume text is too short.' })
    }

    const user = await User.findOne({ uid: req.user.uid })
    const targetRole = role || user.targetRole || 'Software Engineer'

    const analysis = await analyzeResumePDF(text.trim(), targetRole)
    const atsResult = await scoreATS(text.trim(), targetRole)

    const result = {
      atsScore:          analysis.atsScore || atsResult.overallScore || 0,
      sectionScores:     analysis.sectionScores || {},
      strengths:         analysis.strengths || atsResult.strengths || [],
      criticalIssues:    analysis.criticalIssues || [],
      suggestions:       analysis.suggestions || atsResult.suggestions?.map(s => ({ priority: 'medium', category: 'general', text: s })) || [],
      missingKeywords:   analysis.missingKeywords || atsResult.missingKeywords || [],
      presentKeywords:   analysis.presentKeywords || atsResult.presentKeywords || [],
      actionVerbs:       analysis.actionVerbs || { found: [], suggested: [] },
      quantificationCheck: analysis.quantificationCheck || { hasMetrics: false, examples: [] },
      overallFeedback:   analysis.overallFeedback || '',
      resumeText:        text.trim(),
      wordCount:         text.trim().split(/\s+/).length,
    }

    await User.updateOne({ uid: req.user.uid }, { 'scores.resume': result.atsScore })
    await syncOverallScore(req.user.uid)
    const newBadges = await checkAndAwardBadges(user._id, user.uid)

    res.json({ ...result, newBadges })
  } catch (err) {
    console.error('Resume analyze-text error:', err.message)
    res.status(500).json({ message: 'Failed to analyze resume.' })
  }
})

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

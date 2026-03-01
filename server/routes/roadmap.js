const express  = require('express')
const router   = express.Router()
const User     = require('../models/User')
const Roadmap  = require('../models/Roadmap')
const { authMiddleware }    = require('../middleware/authMiddleware')
const { aiLimiter }         = require('../middleware/rateLimiter')
const { generateRoadmap, generateCompanyRoadmap } = require('../services/geminiService')

// Generate new roadmap
router.post('/generate', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const profile = {
      year:            user.year,
      branch:          user.branch,
      targetRole:      user.targetRole,
      targetCompanies: user.targetCompanies,
      skills:          user.skills,
      hoursPerWeek:    user.hoursPerWeek,
    }

    // Deactivate previous roadmaps
    await Roadmap.updateMany({ userId: user._id }, { isActive: false })

    // Generate via Gemini
    const aiRoadmap = await generateRoadmap(profile)

    const roadmap = new Roadmap({
      userId:  user._id,
      userUid: user.uid,
      profile,
      days:    aiRoadmap.days || [],
      version: 1,
    })
    await roadmap.save()

    res.status(201).json({ roadmap })
  } catch (err) {
    console.error('Roadmap generation error:', err)
    res.status(500).json({ message: 'Failed to generate roadmap: ' + err.message })
  }
})

// Get user's current active roadmap
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid })
    const roadmap = await Roadmap.findOne({ userId: user._id, isActive: true })
      .sort({ createdAt: -1 })
    res.json({ roadmap })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Update task completion
router.patch('/task/:taskId', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params
    const { isCompleted, day } = req.body
    const user = await User.findOne({ uid: req.user.uid })
    const roadmap = await Roadmap.findOne({ userId: user._id, isActive: true })
    if (!roadmap) return res.status(404).json({ message: 'Roadmap not found' })

    const dayObj = roadmap.days.find(d => d.day === parseInt(day))
    if (!dayObj) return res.status(404).json({ message: 'Day not found' })

    const task = dayObj.tasks.find(t => t.id === taskId)
    if (task) {
      task.isCompleted = isCompleted
      task.completedAt = isCompleted ? new Date() : null
    }

    // Recalculate day progress
    const completedTasks = dayObj.tasks.filter(t => t.isCompleted).length
    dayObj.progressPct = Math.round((completedTasks / dayObj.tasks.length) * 100)
    if (dayObj.progressPct === 100) {
      dayObj.isCompleted = true
      dayObj.completedAt = new Date()
    }

    roadmap.markModified('days')
    await roadmap.save()

    res.json({ roadmap, task })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get company-specific roadmap
router.get('/company/:company', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const { company } = req.params
    const user = await User.findOne({ uid: req.user.uid })
    const roadmap = await generateCompanyRoadmap(company, user.targetRole)
    res.json({ roadmap, company })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Regenerate roadmap
router.post('/regenerate', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid })
    if (!user) return res.status(404).json({ message: 'User not found' })

    await Roadmap.updateMany({ userId: user._id }, { isActive: false })

    const profile = {
      year: user.year, branch: user.branch, targetRole: user.targetRole,
      targetCompanies: user.targetCompanies, skills: user.skills, hoursPerWeek: user.hoursPerWeek,
    }
    const aiRoadmap = await generateRoadmap(profile)

    const existing = await Roadmap.findOne({ userId: user._id }).sort({ version: -1 })
    const roadmap = new Roadmap({
      userId: user._id, userUid: user.uid, profile, days: aiRoadmap.days || [],
      version: (existing?.version || 0) + 1, isActive: true,
    })
    await roadmap.save()
    res.json({ roadmap })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

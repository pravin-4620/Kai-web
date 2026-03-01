const express  = require('express')
const router   = express.Router()
const multer   = require('multer')
const User     = require('../models/User')
const { authMiddleware }        = require('../middleware/authMiddleware')
const { calculateOverallScore, getGrade } = require('../utils/gradeCalculator')
const { checkAndAwardBadges, updateStreak } = require('../services/badgeEngine')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).lean()
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Update user profile
router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const allowedFields = ['name', 'photoURL', 'college', 'year', 'branch',
      'targetRole', 'targetCompanies', 'skills', 'certifications',
      'hoursPerWeek', 'studySlots', 'focusModeEnabled', 'preferredLanguage',
      'notifPreferences']
    const updates = {}
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f] })

    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $set: updates },
      { new: true, runValidators: true }
    )
    res.json({ user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Complete onboarding
router.post('/onboarding', authMiddleware, async (req, res) => {
  try {
    const { college, year, branch, targetRole, targetCompanies, skills,
            certifications, hoursPerWeek, studySlots, focusModeEnabled,
            preferredLanguage, notifPreferences } = req.body

    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      {
        $set: {
          college, year, branch, targetRole, targetCompanies, skills,
          certifications, hoursPerWeek, studySlots, focusModeEnabled,
          preferredLanguage, notifPreferences,
          onboardingComplete: true,
          sprintStartDate:    new Date(),
          sprintDay:          1,
        },
      },
      { new: true }
    )

    // Update streak on first login
    await updateStreak(user._id)

    res.json({ user, message: 'Onboarding complete! Generating your roadmap...' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Upload avatar (stores URL only; assumes client uploads directly to Firebase Storage)
router.post('/avatar', authMiddleware, async (req, res) => {
  try {
    const { photoURL } = req.body
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $set: { photoURL } },
      { new: true }
    )
    res.json({ user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get calculated score
router.get('/score', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).select('scores streak').lean()
    if (!user) return res.status(404).json({ message: 'User not found' })

    const overall = calculateOverallScore({ ...user.scores, streak: user.streak })
    const grade   = getGrade(overall)

    // Persist updated scores
    await User.updateOne({ uid: req.user.uid }, { overallScore: overall, currentGrade: grade.grade })

    res.json({ overall, grade: grade.grade, label: grade.label, scores: user.scores })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

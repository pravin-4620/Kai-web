const express = require('express')
const router  = express.Router()
const User    = require('../models/User')
const { authMiddleware } = require('../middleware/authMiddleware')
const { calculateOverallScore } = require('../utils/gradeCalculator')

// Institution leaderboard
router.get('/institution', authMiddleware, async (req, res) => {
  try {
    const reqUser = await User.findOne({ uid: req.user.uid })
    const { branch, year, limit = 50 } = req.query

    const filter = {
      college:            reqUser.college,
      onboardingComplete: true,
    }
    if (branch) filter.branch = branch
    if (year)   filter.year   = year

    const users = await User.find(filter)
      .select('name photoURL college year branch overallScore currentGrade streak badges targetRole')
      .sort({ overallScore: -1 })
      .limit(parseInt(limit))
      .lean()

    // Add rank
    const ranked = users.map((u, i) => ({ ...u, rank: i + 1 }))

    // Find current user's rank
    const myRank = ranked.findIndex(u => u._id.toString() === reqUser._id.toString()) + 1
    const myEntry = ranked.find(u => u._id.toString() === reqUser._id.toString())

    // Update current user's rank in DB
    if (myRank > 0 && myRank !== reqUser.rank) {
      await User.updateOne({ _id: reqUser._id }, { rank: myRank })

      // Top 10 badge
      if (myRank <= 10) {
        await User.updateOne({ _id: reqUser._id }, { $addToSet: { badges: 'top_10' } })
      }
      // Institution champion
      if (myRank === 1) {
        await User.updateOne({ _id: reqUser._id }, { $addToSet: { badges: 'institution_champ' } })
      }
    }

    // Emit real-time update via socket.io
    // req.app.get('io').to(`leaderboard:${reqUser.college}`).emit('leaderboard-update', ranked.slice(0, 10))

    res.json({ leaderboard: ranked.slice(0, 10), myRank, myEntry, total: ranked.length })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Global leaderboard
router.get('/global', authMiddleware, async (req, res) => {
  try {
    const { limit = 50 } = req.query
    const users = await User.find({ onboardingComplete: true })
      .select('name photoURL college year branch overallScore currentGrade streak badges')
      .sort({ overallScore: -1 })
      .limit(parseInt(limit))
      .lean()

    const ranked = users.map((u, i) => ({ ...u, rank: i + 1 }))
    res.json({ leaderboard: ranked })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get my rank
router.get('/my-rank', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid })
    const rank = await User.countDocuments({
      college: user.college,
      onboardingComplete: true,
      overallScore: { $gt: user.overallScore || 0 },
    })
    const totalInInstitution = await User.countDocuments({ college: user.college, onboardingComplete: true })
    res.json({ rank: rank + 1, total: totalInInstitution, college: user.college, overallScore: user.overallScore || 0, name: user.name })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

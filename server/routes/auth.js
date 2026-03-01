const express = require('express')
const router  = express.Router()
const User    = require('../models/User')
const { authLimiter } = require('../middleware/rateLimiter')
const { authMiddleware } = require('../middleware/authMiddleware')

// Sync Firebase user to MongoDB (called on every login)
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const { uid, email, name, photoURL, provider } = req.body

    let user = await User.findOne({ uid })
    const isNew = !user

    if (!user) {
      user = new User({ uid, email, name: name || '', photoURL: photoURL || '', provider: provider || 'email' })
      await user.save()
    } else {
      // Update basic info from Firebase
      if (name)     user.name     = name
      if (photoURL) user.photoURL = photoURL
      await user.save()
    }

    res.json({ user, isNew })
  } catch (err) {
    console.error('Sync error:', err)
    res.status(500).json({ message: 'Failed to sync user' })
  }
})

// Register new user
router.post('/register', authLimiter, authMiddleware, async (req, res) => {
  try {
    const { uid, email, name, photoURL } = req.body
    const existing = await User.findOne({ uid })
    if (existing) return res.json({ user: existing, isNew: false })

    const user = new User({ uid, email, name: name || '', photoURL: photoURL || '' })
    await user.save()
    res.status(201).json({ user, isNew: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

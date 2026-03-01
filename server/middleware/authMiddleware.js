const { admin } = require('../config/firebase-admin')

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No authorization token provided' })
  }

  const idToken = authHeader.split('Bearer ')[1]
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    req.user = {
      uid:   decodedToken.uid,
      email: decodedToken.email,
      name:  decodedToken.name,
    }
    next()
  } catch (err) {
    console.error('Auth middleware error:', err.code)
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Token expired. Please sign in again.' })
    }
    return res.status(401).json({ message: 'Invalid authentication token' })
  }
}

// Optional auth — attaches user if token present but doesn't block
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return next()

  const idToken = authHeader.split('Bearer ')[1]
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    req.user = {
      uid:   decodedToken.uid,
      email: decodedToken.email,
      name:  decodedToken.name,
    }
  } catch { /* token invalid, continue as guest */ }
  next()
}

module.exports = { authMiddleware, optionalAuth }

const rateLimit = require('express-rate-limit')

// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { message: 'Too many requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// AI endpoint limiter — 20 calls per hour per user
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req) => req.user?.uid || req.ip,
  message: { message: 'AI rate limit exceeded (20 calls/hour). Please wait before making more AI requests.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Doubt solver — 10 per day
const doubtLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10,
  keyGenerator: (req) => req.user?.uid || req.ip,
  message: { message: 'Daily AI chat limit reached (10 queries/day). Try again tomorrow.' },
})

// Auth rate limit — prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many auth attempts. Please wait 15 minutes.' },
})

// Code execution limiter
const codeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  keyGenerator: (req) => req.user?.uid || req.ip,
  message: { message: 'Code execution rate limit reached. Please wait 1 minute.' },
})

module.exports = { generalLimiter, aiLimiter, doubtLimiter, authLimiter, codeLimiter }

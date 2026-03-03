require('dotenv').config()
const express  = require('express')
const cors     = require('cors')
const helmet   = require('helmet')
const http     = require('http')
const { Server } = require('socket.io')

const { connectDB, getDbStatus } = require('./config/db')
const { initFirebaseAdmin } = require('./config/firebase-admin')
const { generalLimiter } = require('./middleware/rateLimiter')

// Routes
const authRoutes        = require('./routes/auth')
const userRoutes        = require('./routes/user')
const roadmapRoutes     = require('./routes/roadmap')
const companiesRoutes   = require('./routes/companies')
const resumeRoutes      = require('./routes/resume')
const codingRoutes      = require('./routes/coding')
const quizRoutes        = require('./routes/quiz')
const interviewRoutes   = require('./routes/interview')
const softSkillsRoutes  = require('./routes/softskills')
const leaderboardRoutes = require('./routes/leaderboard')
const analyticsRoutes   = require('./routes/analytics')
const vapiProxyRoutes   = require('./routes/vapiProxy')

const app    = express()
const server = http.createServer(app)

const parseAllowedOrigins = () => {
  const defaults = ['http://localhost:5173']
  const fromClientUrl = process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []
  const fromClientUrls = (process.env.CLIENT_URLS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return [...new Set([...fromClientUrl, ...fromClientUrls, ...defaults])]
}

const allowedOrigins = parseAllowedOrigins()

const corsOriginValidator = (origin, callback) => {
  if (!origin) return callback(null, true)
  if (allowedOrigins.includes(origin)) return callback(null, true)
  return callback(new Error('Not allowed by CORS'))
}

// Socket.io for real-time features
const io = new Server(server, {
  cors: {
    origin:      corsOriginValidator,
    methods:     ['GET', 'POST'],
    credentials: true,
  },
})

// Init Firebase Admin
initFirebaseAdmin()

// Connect to MongoDB
connectDB()

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}))

app.use(cors({
  origin:      corsOriginValidator,
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(generalLimiter)

// Request logger (dev)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`)
    next()
  })
}

// DB guard: keep server reachable and fail fast with clear message
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next()

  const db = getDbStatus()
  if (!db.connected) {
    return res.status(503).json({
      message: 'Database unavailable. Please allow your IP in MongoDB Atlas Network Access and retry.',
      code: 'DB_UNAVAILABLE',
    })
  }
  next()
})

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes)
app.use('/api/user',        userRoutes)
app.use('/api/roadmap',     roadmapRoutes)
app.use('/api/companies',   companiesRoutes)
app.use('/api/resume',      resumeRoutes)
app.use('/api/coding',      codingRoutes)
app.use('/api/quiz',        quizRoutes)
app.use('/api/interview',   interviewRoutes)
app.use('/api/softskills',  softSkillsRoutes)
app.use('/api/leaderboard', leaderboardRoutes)
app.use('/api/analytics',   analyticsRoutes)
app.use('/api/vapi-proxy',  vapiProxyRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  const db = getDbStatus()
  res.json({
    status:    'ok',
    service:   'KAI API',
    database:  db.connected ? 'connected' : 'disconnected',
    databaseMode: db.mode,
    timestamp: new Date().toISOString(),
    version:   '1.0.0',
  })
})

// ─── Socket.io ───────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('join-leaderboard', (college) => {
    socket.join(`leaderboard:${college}`)
  })
  socket.on('disconnect', () => {})
})

// Export io so routes can emit events
app.set('io', io)

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
})

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

module.exports = { app, server, io }

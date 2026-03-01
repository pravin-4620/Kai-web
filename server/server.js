const { server } = require('./app')
const cron = require('node-cron')

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║   🚀 KAI API Server Running           ║
║   Port: ${PORT}                          ║
║   Env:  ${process.env.NODE_ENV || 'development'}              ║
║                                       ║
╚═══════════════════════════════════════╝
  `)
})

// ─── Cron Jobs ────────────────────────────────────────────────────────────────

// Daily digest at 8 AM IST (2:30 AM UTC)
cron.schedule('30 2 * * *', async () => {
  console.log('📧 Running daily digest cron...')
  // TODO: Implement email digest with Nodemailer/Resend
})

// Update sprint days daily at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const User = require('./models/User')
    const users = await User.find({ onboardingComplete: true, sprintStartDate: { $exists: true } })
    for (const user of users) {
      const diff = Math.floor((Date.now() - new Date(user.sprintStartDate)) / 86400000)
      const newDay = Math.min(Math.max(diff + 1, 1), 7)
      if (user.sprintDay !== newDay) {
        await User.updateOne({ _id: user._id }, { sprintDay: newDay })
      }
    }
    console.log(`✅ Updated sprint days for ${users.length} users`)
  } catch (err) {
    console.error('Cron error:', err.message)
  }
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...')
  server.close(() => {
    console.log('Server closed.')
    process.exit(0)
  })
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason)
})

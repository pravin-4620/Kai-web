const FocusSession = require('../models/FocusSession')
const User = require('../models/User')

const proctorLogger = async (req, res, next) => {
  // Log suspicious events from test submissions
  const { violations, isFlagged, sessionId } = req.body

  if (isFlagged && req.user) {
    try {
      // Mark user test as flagged
      console.warn(`🚨 Flagged submission from user ${req.user.uid}`)
    } catch { /* silent */ }
  }
  next()
}

// Log a focus session violation
const logViolationEvent = async (userId, userUid, type, relatedTestId = null) => {
  try {
    let session = await FocusSession.findOne({
      userUid,
      relatedTestId: relatedTestId || undefined,
      endedAt: { $exists: false },
    }).sort({ startedAt: -1 })

    if (session) {
      session.violations.push({ type, timestamp: new Date() })
      session.violationCount += 1
      // Deduct 10 points per violation from focus score
      session.focusScore = Math.max(0, 100 - session.violationCount * 10)
      if (session.violationCount >= 3) session.isFlagged = true
      await session.save()
    }
  } catch (err) {
    console.error('Proctor logger error:', err.message)
  }
}

// Start focus session
const startFocusSession = async (userId, userUid, type, relatedTestId) => {
  try {
    const session = new FocusSession({
      userId,
      userUid,
      type,
      relatedTestId,
      startedAt: new Date(),
    })
    await session.save()
    return session._id.toString()
  } catch (err) {
    console.error('Start focus session error:', err.message)
    return null
  }
}

// End focus session
const endFocusSession = async (sessionId, userId) => {
  try {
    const session = await FocusSession.findOne({ _id: sessionId, userId })
    if (!session) return
    session.endedAt = new Date()
    session.duration = Math.round((session.endedAt - session.startedAt) / 60000)
    await session.save()

    // Update user daily activity
    const today = new Date().toISOString().split('T')[0]
    await User.updateOne(
      { _id: userId },
      {
        $inc: { 'dailyActivity.$[el].hoursStudied': session.duration / 60 },
      },
      { arrayFilters: [{ 'el.date': new Date(today) }], upsert: false }
    )
  } catch (err) {
    console.error('End focus session error:', err.message)
  }
}

module.exports = { proctorLogger, logViolationEvent, startFocusSession, endFocusSession }

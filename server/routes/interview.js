const express          = require('express')
const router           = express.Router()
const User             = require('../models/User')
const InterviewSession = require('../models/InterviewSession')
const { authMiddleware } = require('../middleware/authMiddleware')
const { aiLimiter }      = require('../middleware/rateLimiter')
const { interviewChat, generateInterviewReport } = require('../services/geminiService')
const { checkAndAwardBadges, updateStreak }        = require('../services/badgeEngine')
const { getGrade }     = require('../utils/gradeCalculator')
const { syncOverallScore } = require('../utils/scoreSync')

// Start interview session
router.post('/start', authMiddleware, async (req, res) => {
  try {
    const { type, company, difficulty, duration, role } = req.body
    const user = await User.findOne({ uid: req.user.uid })

    // Grade lock temporarily disabled
    // if ((user.overallScore || 0) < 60) { ... }

    const session = new InterviewSession({
      userId:     user._id,
      userUid:    user.uid,
      type:       type || 'technical',
      company:    company || '',
      difficulty: difficulty || 'junior',
      duration:   duration || 30,
      status:     'active',
    })
    await session.save()

    // Generate opening question
    const config = { type: session.type, company: session.company, difficulty: session.difficulty, role: role || user.targetRole }
    const openingMsg = await interviewChat([{ role: 'user', content: 'Hello, I am ready to start the interview.' }], config)

    session.messages.push({ role: 'interviewer', content: openingMsg, timestamp: new Date() })
    await session.save()

    res.status(201).json({ session, openingMessage: openingMsg })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Send message
router.post('/message', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const { sessionId, message } = req.body
    const user = await User.findOne({ uid: req.user.uid })
    const session = await InterviewSession.findOne({ _id: sessionId, userId: user._id, status: 'active' })
    if (!session) return res.status(404).json({ message: 'Session not found or already ended' })

    // Add user message
    session.messages.push({ role: 'user', content: message, timestamp: new Date() })

    // Get AI response
    const config = { type: session.type, company: session.company, difficulty: session.difficulty }
    const aiResponse = await interviewChat(session.messages, config)

    // Check if interview ended
    const isEnded = /thank you for your time/i.test(aiResponse) || /interview is now complete/i.test(aiResponse)

    session.messages.push({ role: 'interviewer', content: aiResponse, timestamp: new Date() })
    if (isEnded) {
      session.status = 'completed'
      session.completedAt = new Date()
    }
    await session.save()

    res.json({ response: aiResponse, isEnded, sessionId })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// End interview and generate report
router.post('/end/:sessionId', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const user    = await User.findOne({ uid: req.user.uid })
    const session = await InterviewSession.findOne({ _id: req.params.sessionId, userId: user._id })
    if (!session) return res.status(404).json({ message: 'Session not found' })

    session.status = 'completed'
    session.completedAt = new Date()

    // Generate AI report
    const config = { type: session.type, company: session.company, difficulty: session.difficulty }
    const report = await generateInterviewReport(session.messages, config)
    session.report = report
    await session.save()

    // Update user interview score
    const prevScore = user.scores?.interview || 0
    const newScore  = Math.round(prevScore * 0.6 + (report.overallScore || 0) * 0.4)
    await User.updateOne({ uid: req.user.uid }, { 'scores.interview': newScore })
    await syncOverallScore(req.user.uid)

    await updateStreak(user._id)
    const newBadges = await checkAndAwardBadges(user._id, user.uid)

    res.json({ session, report, grade: getGrade(report.overallScore || 0), newBadges })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get report
router.get('/report/:sessionId', authMiddleware, async (req, res) => {
  try {
    const user    = await User.findOne({ uid: req.user.uid })
    const session = await InterviewSession.findOne({ _id: req.params.sessionId, userId: user._id })
    if (!session) return res.status(404).json({ message: 'Session not found' })
    res.json({ session })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid })
    const sessions = await InterviewSession.find({ userId: user._id })
      .select('-messages')
      .sort({ createdAt: -1 })
      .limit(10)
    res.json({ sessions })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Voice Interview (Vapi) ──────────────────────────────────────────────────

// Start voice interview session (no AI opening message needed — Vapi handles it)
router.post('/start-voice', authMiddleware, async (req, res) => {
  try {
    const { type, company, difficulty, role } = req.body
    const user = await User.findOne({ uid: req.user.uid })

    // Grade lock temporarily disabled
    // if ((user.overallScore || 0) < 60) { ... }

    const session = new InterviewSession({
      userId:     user._id,
      userUid:    user.uid,
      type:       type || 'technical',
      company:    company || '',
      difficulty: difficulty || 'junior',
      duration:   30,
      status:     'active',
    })
    await session.save()

    res.status(201).json({ session })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// End voice interview — accept transcript from Vapi, generate report
router.post('/end-voice/:sessionId', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const { transcript } = req.body
    const user    = await User.findOne({ uid: req.user.uid })
    const session = await InterviewSession.findOne({ _id: req.params.sessionId, userId: user._id })
    if (!session) return res.status(404).json({ message: 'Session not found' })

    session.status      = 'completed'
    session.completedAt = new Date()

    // Store voice transcript as messages
    if (Array.isArray(transcript) && transcript.length) {
      session.messages = transcript.map(t => ({
        role:      t.role === 'interviewer' ? 'interviewer' : 'user',
        content:   t.content || '',
        timestamp: t.timestamp ? new Date(t.timestamp) : new Date(),
      }))
    }

    let report
    if (session.messages && session.messages.length > 0) {
      // Generate AI report from the conversation
      const config = { type: session.type, company: session.company, difficulty: session.difficulty }
      try {
        report = await generateInterviewReport(session.messages, config)
      } catch (aiErr) {
        console.warn('AI report generation failed, using heuristic fallback:', aiErr.message?.slice(0, 120))
        // Heuristic fallback: score based on conversation length/depth
        const userMsgs = session.messages.filter(m => m.role === 'user')
        const avgLen = userMsgs.reduce((s, m) => s + (m.content?.length || 0), 0) / (userMsgs.length || 1)
        const baseScore = Math.min(70, Math.round(30 + (userMsgs.length * 5) + (avgLen > 80 ? 15 : avgLen > 40 ? 8 : 0)))
        report = {
          overallScore: baseScore,
          technicalAccuracy: baseScore,
          communication: Math.min(85, baseScore + 5),
          problemSolving: Math.max(20, baseScore - 5),
          confidence: baseScore,
          relevance: baseScore,
          strengths: ['Completed the interview session', userMsgs.length >= 5 ? 'Answered multiple questions' : 'Participated in the conversation'].filter(Boolean),
          improvements: ['AI analysis temporarily unavailable — retake the interview for a detailed report', 'Practice structuring your answers using the STAR method'],
          resources: ['Cracking the Coding Interview', 'System Design Primer (GitHub)'],
          perQuestionScores: [],
        }
      }
    } else {
      // Fallback report when no conversation was captured
      report = {
        overallScore: 0,
        technicalAccuracy: 0,
        communication: 0,
        problemSolving: 0,
        confidence: 0,
        relevance: 0,
        strengths: [],
        improvements: ['No conversation was captured. Please ensure your microphone is working and try again.'],
        resources: [],
        perQuestionScores: [],
      }
    }

    session.report = report
    await session.save()

    // Update user interview score (rolling average)
    const prevScore = user.scores?.interview || 0
    const newScore  = Math.round(prevScore * 0.6 + (report.overallScore || 0) * 0.4)
    await User.updateOne({ uid: req.user.uid }, { 'scores.interview': newScore })
    await syncOverallScore(req.user.uid)

    await updateStreak(user._id)
    const newBadges = await checkAndAwardBadges(user._id, user.uid)

    res.json({ session, report, grade: getGrade(report.overallScore || 0), newBadges })
  } catch (err) {
    console.error('end-voice error:', err)
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

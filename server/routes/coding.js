const express      = require('express')
const router       = express.Router()
const User         = require('../models/User')
const TestAttempt  = require('../models/TestAttempt')
const { authMiddleware }   = require('../middleware/authMiddleware')
const { aiLimiter, codeLimiter } = require('../middleware/rateLimiter')
const { runTestCases }     = require('../services/codeEvaluator')
const { evaluateCode }     = require('../services/geminiService')
const { checkAndAwardBadges, updateStreak } = require('../services/badgeEngine')
const { getGrade }         = require('../utils/gradeCalculator')
const { logViolationEvent } = require('../middleware/proctorLogger')
const { syncOverallScore } = require('../utils/scoreSync')

// Hardcoded problem bank for demo
const PROBLEMS = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'easy',
    tags: ['Array', 'Hash Table'],
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers that add up to target.\n\n**Example:**\n```\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\n```\n**Constraints:** 2 ≤ nums.length ≤ 10⁴',
    examples: [{ input: '[2,7,11,15]\n9', output: '[0,1]' }, { input: '[3,2,4]\n6', output: '[1,2]' }],
    testCases: [{ input: '[2,7,11,15]\n9', expectedOutput: '[0, 1]' }, { input: '[3,2,4]\n6', expectedOutput: '[1, 2]' }, { input: '[3,3]\n6', expectedOutput: '[0, 1]' }],
    hints: ['Try using a hash map', 'For each element, check if target - element exists', 'Store visited elements in a dictionary'],
    timeLimit: 2000,
  },
  {
    id: 'reverse-string',
    title: 'Reverse String',
    difficulty: 'easy',
    tags: ['String', 'Two Pointers'],
    description: 'Write a function that reverses a string. The input is given as an array of characters.\n\n**Example:**\n```\nInput: ["h","e","l","l","o"]\nOutput: ["o","l","l","e","h"]\n```',
    examples: [{ input: '["h","e","l","l","o"]', output: '["o","l","l","e","h"]' }],
    testCases: [{ input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]' }],
    hints: ['Use two pointers', 'Swap elements from both ends'],
    timeLimit: 2000,
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'medium',
    tags: ['Stack', 'String'],
    description: 'Given a string s containing just the characters `(`, `)`, `{`, `}`, `[`, `]`, determine if the input string is valid.\n\n**Example:**\n```\nInput: s = "()[]{}" → Output: true\nInput: s = "(]"    → Output: false\n```',
    examples: [{ input: '"()[]{}"', output: 'true' }, { input: '"(]"', output: 'false' }],
    testCases: [{ input: '"()[]{}"', expectedOutput: 'true' }, { input: '"(]"', expectedOutput: 'false' }, { input: '"([)]"', expectedOutput: 'false' }],
    hints: ['Use a stack data structure', 'Push opening brackets, pop and check for closing brackets'],
    timeLimit: 2000,
  },
  {
    id: 'maximum-subarray',
    title: 'Maximum Subarray',
    difficulty: 'medium',
    tags: ['Array', 'Dynamic Programming'],
    description: 'Given an integer array `nums`, find the subarray with the largest sum and return its sum.\n\n**Example:**\n```\nInput: [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6  (subarray [4,-1,2,1])\n```',
    examples: [{ input: '[-2,1,-3,4,-1,2,1,-5,4]', output: '6' }],
    testCases: [{ input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6' }, { input: '[1]', expectedOutput: '1' }],
    hints: ["Kadane's Algorithm", 'Keep track of current sum and max sum'],
    timeLimit: 2000,
  },
  {
    id: 'merge-intervals',
    title: 'Merge Intervals',
    difficulty: 'hard',
    tags: ['Array', 'Sorting'],
    description: 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals.\n\n**Example:**\n```\nInput: [[1,3],[2,6],[8,10],[15,18]]\nOutput: [[1,6],[8,10],[15,18]]\n```',
    examples: [{ input: '[[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]' }],
    testCases: [{ input: '[[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]' }],
    hints: ['Sort intervals by start time', 'Merge overlapping intervals'],
    timeLimit: 2000,
  },
]

// Get all problems
router.get('/problems', authMiddleware, async (req, res) => {
  const { difficulty, tag } = req.query
  let problems = PROBLEMS
  if (difficulty) problems = problems.filter(p => p.difficulty === difficulty)
  if (tag) problems = problems.filter(p => p.tags.some(t => t.toLowerCase() === tag.toLowerCase()))
  res.json({ problems: problems.map(({ testCases, ...p }) => p) })
})

// Get single problem (without hidden test cases)
router.get('/problems/:id', authMiddleware, async (req, res) => {
  const problem = PROBLEMS.find(p => p.id === req.params.id) || PROBLEMS[0]
  const { testCases, ...safeProb } = problem
  // Return visible examples only
  res.json({ problem: { ...safeProb, visibleTestCases: problem.examples } })
})

// Run code (visible test cases only)
router.post('/run', authMiddleware, codeLimiter, async (req, res) => {
  try {
    const { code, language, problemId, testCases } = req.body
    const problem = PROBLEMS.find(p => p.id === problemId) || PROBLEMS[0]
    const cases = testCases || problem.examples.map(e => ({ input: e.input, expectedOutput: e.output }))

    const result = await runTestCases(code, language, cases.slice(0, 3))
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Submit code (all test cases + AI evaluation)
router.post('/submit', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const { code, language, problemId, timeTaken, violations = [] } = req.body
    const user    = await User.findOne({ uid: req.user.uid })
    const problem = PROBLEMS.find(p => p.id === problemId) || PROBLEMS[0]

    // Run all test cases
    const { results, passRate, avgRuntime, maxMemory } = await runTestCases(code, language, problem.testCases)

    // AI evaluation
    const aiEval = await evaluateCode(problem, code, language, results)

    const attempt = new TestAttempt({
      userId:           user._id,
      userUid:          user.uid,
      problemId,
      problemTitle:     problem.title,
      difficulty:       problem.difficulty,
      language,
      code,
      testCaseResults:  results,
      passRate,
      executionTime:    avgRuntime,
      memoryUsed:       maxMemory,
      aiEvaluation:     aiEval,
      violations:       violations.map(v => ({ type: v, timestamp: new Date() })),
      isFlagged:        violations.length >= 3,
      timeTaken,
      submittedAt:      new Date(),
    })
    await attempt.save()

    // Update user coding score (weighted average with previous)
    const prevScore = user.scores?.coding || 0
    const newScore  = Math.round(prevScore * 0.7 + (aiEval.correctnessScore || 0) * 0.3)
    await User.updateOne({ uid: req.user.uid }, { 'scores.coding': newScore })
    await syncOverallScore(req.user.uid)

    // Update streak and check badges
    await updateStreak(user._id)
    const newBadges = await checkAndAwardBadges(user._id, user.uid)

    res.json({
      attempt,
      passRate,
      aiEvaluation: aiEval,
      grade:        getGrade(aiEval.correctnessScore || 0),
      newBadges,
    })
  } catch (err) {
    console.error('Submit error:', err)
    res.status(500).json({ message: err.message })
  }
})

// Get attempts history
router.get('/attempts', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid })
    const attempts = await TestAttempt.find({ userId: user._id })
      .select('-code -testCaseResults')
      .sort({ submittedAt: -1 })
      .limit(50)
    res.json({ attempts })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get single attempt (full)
router.get('/attempts/:id', authMiddleware, async (req, res) => {
  try {
    const user    = await User.findOne({ uid: req.user.uid })
    const attempt = await TestAttempt.findOne({ _id: req.params.id, userId: user._id })
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' })
    res.json({ attempt })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Log violation
router.post('/violation', authMiddleware, async (req, res) => {
  try {
    const { testId, type, timestamp } = req.body
    const user = await User.findOne({ uid: req.user.uid })
    await logViolationEvent(user._id, user.uid, type, testId)
    res.json({ logged: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

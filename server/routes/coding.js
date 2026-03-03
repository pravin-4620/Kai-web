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

/* ─── Problem Bank ──────────────────────────────────────────────────────────── */
const PROBLEMS = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'easy',
    tags: ['Array', 'Hash Table'],
    timeLimitMins: 15,
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nReturn the answer in any order.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0, 1]', explanation: 'nums[0] + nums[1] = 2 + 7 = 9' },
      { input: 'nums = [3,2,4], target = 6', output: '[1, 2]' },
      { input: 'nums = [3,3], target = 6', output: '[0, 1]' },
    ],
    constraints: ['2 ≤ nums.length ≤ 10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹', 'Only one valid answer exists.'],
    testCases: [
      { input: '[2,7,11,15]\n9', expectedOutput: '[0, 1]' },
      { input: '[3,2,4]\n6', expectedOutput: '[1, 2]' },
      { input: '[3,3]\n6', expectedOutput: '[0, 1]' },
      { input: '[1,5,3,7]\n8', expectedOutput: '[1, 2]' },
    ],
    starterCode: {
      python: 'def twoSum(nums: list[int], target: int) -> list[int]:\n    # Write your solution here\n    pass\n',
      javascript: '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n    // Write your solution here\n    \n}\n',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}\n',
      cpp: '#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n        return {};\n    }\n};\n',
      go: 'func twoSum(nums []int, target int) []int {\n    // Write your solution here\n    return nil\n}\n',
      rust: 'impl Solution {\n    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {\n        // Write your solution here\n        vec![]\n    }\n}\n',
    },
    hints: ['Try using a hash map to store visited numbers.', 'For each element, check if (target - element) already exists in the map.'],
  },
  {
    id: 'reverse-string',
    title: 'Reverse String',
    difficulty: 'easy',
    tags: ['String', 'Two Pointers'],
    timeLimitMins: 10,
    description: 'Write a function that reverses a string. The input string is given as an array of characters `s`.\n\nYou must do this by modifying the input array **in-place** with O(1) extra memory.',
    examples: [
      { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]' },
      { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]' },
    ],
    constraints: ['1 ≤ s.length ≤ 10⁵', 's[i] is a printable ASCII character.'],
    testCases: [
      { input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]' },
      { input: '["H","a","n","n","a","h"]', expectedOutput: '["h","a","n","n","a","H"]' },
      { input: '["A"]', expectedOutput: '["A"]' },
    ],
    starterCode: {
      python: 'def reverseString(s: list[str]) -> None:\n    """\n    Do not return anything, modify s in-place instead.\n    """\n    pass\n',
      javascript: '/**\n * @param {character[]} s\n * @return {void}\n */\nfunction reverseString(s) {\n    // Write your solution here\n}\n',
      java: 'class Solution {\n    public void reverseString(char[] s) {\n        // Write your solution here\n    }\n}\n',
      cpp: '#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    void reverseString(vector<char>& s) {\n        // Write your solution here\n    }\n};\n',
      go: 'func reverseString(s []byte) {\n    // Write your solution here\n}\n',
      rust: 'impl Solution {\n    pub fn reverse_string(s: &mut Vec<char>) {\n        // Write your solution here\n    }\n}\n',
    },
    hints: ['Use two pointers — one at the start, one at the end.', 'Swap elements and move both pointers inward.'],
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'medium',
    tags: ['Stack', 'String'],
    timeLimitMins: 15,
    description: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
    ],
    constraints: ['1 ≤ s.length ≤ 10⁴', 's consists of parentheses only: ()[]{}'],
    testCases: [
      { input: '"()"', expectedOutput: 'true' },
      { input: '"()[]{}"', expectedOutput: 'true' },
      { input: '"(]"', expectedOutput: 'false' },
      { input: '"([)]"', expectedOutput: 'false' },
      { input: '"{[]}"', expectedOutput: 'true' },
    ],
    starterCode: {
      python: 'def isValid(s: str) -> bool:\n    # Write your solution here\n    pass\n',
      javascript: '/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isValid(s) {\n    // Write your solution here\n}\n',
      java: 'class Solution {\n    public boolean isValid(String s) {\n        // Write your solution here\n        return false;\n    }\n}\n',
      cpp: '#include <string>\n#include <stack>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isValid(string s) {\n        // Write your solution here\n        return false;\n    }\n};\n',
      go: 'func isValid(s string) bool {\n    // Write your solution here\n    return false\n}\n',
      rust: 'impl Solution {\n    pub fn is_valid(s: String) -> bool {\n        // Write your solution here\n        false\n    }\n}\n',
    },
    hints: ['Use a stack to keep track of opening brackets.', 'When encountering a closing bracket, check if the top of the stack matches.'],
  },
  {
    id: 'maximum-subarray',
    title: 'Maximum Subarray',
    difficulty: 'medium',
    tags: ['Array', 'Dynamic Programming'],
    timeLimitMins: 20,
    description: 'Given an integer array `nums`, find the subarray with the largest sum, and return its sum.\n\nA **subarray** is a contiguous non-empty sequence of elements within an array.',
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' },
      { input: 'nums = [1]', output: '1' },
      { input: 'nums = [5,4,-1,7,8]', output: '23' },
    ],
    constraints: ['1 ≤ nums.length ≤ 10⁵', '-10⁴ ≤ nums[i] ≤ 10⁴'],
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6' },
      { input: '[1]', expectedOutput: '1' },
      { input: '[5,4,-1,7,8]', expectedOutput: '23' },
      { input: '[-1]', expectedOutput: '-1' },
    ],
    starterCode: {
      python: 'def maxSubArray(nums: list[int]) -> int:\n    # Write your solution here\n    pass\n',
      javascript: '/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction maxSubArray(nums) {\n    // Write your solution here\n}\n',
      java: 'class Solution {\n    public int maxSubArray(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}\n',
      cpp: '#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Write your solution here\n        return 0;\n    }\n};\n',
      go: 'func maxSubArray(nums []int) int {\n    // Write your solution here\n    return 0\n}\n',
      rust: 'impl Solution {\n    pub fn max_sub_array(nums: Vec<i32>) -> i32 {\n        // Write your solution here\n        0\n    }\n}\n',
    },
    hints: ["Think about Kadane's algorithm.", 'At each position, decide: extend the previous subarray or start fresh.'],
  },
  {
    id: 'merge-intervals',
    title: 'Merge Intervals',
    difficulty: 'hard',
    tags: ['Array', 'Sorting'],
    timeLimitMins: 25,
    description: 'Given an array of `intervals` where `intervals[i] = [startᵢ, endᵢ]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
    examples: [
      { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', explanation: 'Intervals [1,3] and [2,6] overlap, merged to [1,6].' },
      { input: 'intervals = [[1,4],[4,5]]', output: '[[1,5]]', explanation: 'Intervals [1,4] and [4,5] are considered overlapping.' },
    ],
    constraints: ['1 ≤ intervals.length ≤ 10⁴', 'intervals[i].length == 2', '0 ≤ startᵢ ≤ endᵢ ≤ 10⁴'],
    testCases: [
      { input: '[[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]' },
      { input: '[[1,4],[4,5]]', expectedOutput: '[[1,5]]' },
      { input: '[[1,4],[0,4]]', expectedOutput: '[[0,4]]' },
    ],
    starterCode: {
      python: 'def merge(intervals: list[list[int]]) -> list[list[int]]:\n    # Write your solution here\n    pass\n',
      javascript: '/**\n * @param {number[][]} intervals\n * @return {number[][]}\n */\nfunction merge(intervals) {\n    // Write your solution here\n}\n',
      java: 'import java.util.*;\n\nclass Solution {\n    public int[][] merge(int[][] intervals) {\n        // Write your solution here\n        return new int[][]{};\n    }\n}\n',
      cpp: '#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        // Write your solution here\n        return {};\n    }\n};\n',
      go: 'func merge(intervals [][]int) [][]int {\n    // Write your solution here\n    return nil\n}\n',
      rust: 'impl Solution {\n    pub fn merge(intervals: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n        // Write your solution here\n        vec![]\n    }\n}\n',
    },
    hints: ['Sort intervals by their start value.', 'Iterate and merge by comparing current end with next start.'],
  },
]

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

/* ─── Session: pick 3 problems (1 easy, 1 medium, 1 hard) ──────────────────── */
router.get('/session', authMiddleware, (req, res) => {
  const easy   = PROBLEMS.filter(p => p.difficulty === 'easy')
  const medium = PROBLEMS.filter(p => p.difficulty === 'medium')
  const hard   = PROBLEMS.filter(p => p.difficulty === 'hard')
  const session = [pick(easy), pick(medium), pick(hard)]
  const problems = session.map(({ testCases, ...p }) => p)
  res.json({ problems })
})

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
    const { code, language, problemId } = req.body
    if (!code || !language || !problemId) {
      return res.status(400).json({ message: 'code, language, and problemId are required' })
    }
    const problem = PROBLEMS.find(p => p.id === problemId)
    if (!problem) return res.status(404).json({ message: 'Problem not found' })

    const cases = problem.examples.map(e => ({ input: e.input, expectedOutput: e.output }))
    const { results, passRate, passCount, totalCases } = await runTestCases(code, language, cases)

    res.json({
      results,
      passRate,
      passedCount: passCount,
      totalCount:  totalCases,
      allPassed:   passCount === totalCases,
    })
  } catch (err) {
    console.error('Run error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

// Submit code (all test cases + AI evaluation)
router.post('/submit', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const { code, language, problemId, timeTaken, violations = [] } = req.body
    if (!code || !language || !problemId) {
      return res.status(400).json({ message: 'code, language, and problemId are required' })
    }
    const user = await User.findOne({ uid: req.user.uid })
    if (!user) return res.status(404).json({ message: 'User not found' })
    const problem = PROBLEMS.find(p => p.id === problemId)
    if (!problem) return res.status(404).json({ message: 'Problem not found' })

    // Run all hidden test cases
    const { results, passRate, passCount, totalCases, avgRuntime, maxMemory } =
      await runTestCases(code, language, problem.testCases)

    // AI evaluation with fallback
    let aiEval
    try {
      aiEval = await evaluateCode(problem, code, language, results)
    } catch (aiErr) {
      console.error('AI eval failed, using heuristic:', aiErr.message)
      aiEval = {
        correctnessScore: Math.round(passRate),
        codeQualityScore:  Math.round(passRate * 0.8),
        timeComplexity:    'N/A',
        spaceComplexity:   'N/A',
        suggestions:       ['AI evaluation unavailable — score based on test results.'],
        optimalSolution:   '',
        overallGrade:      getGrade(Math.round(passRate)),
      }
    }

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

    // Streak + badges
    await updateStreak(user._id)
    const newBadges = await checkAndAwardBadges(user._id, user.uid)

    res.json({
      attempt: {
        _id:          attempt._id,
        problemId,
        problemTitle: problem.title,
        passRate,
        aiEvaluation: aiEval,
        timeTaken,
      },
      passRate,
      passedCount:  passCount,
      totalCount:   totalCases,
      allPassed:    passCount === totalCases,
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

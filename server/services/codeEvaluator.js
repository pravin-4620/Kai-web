const axios = require('axios')

const JUDGE0_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com'
const JUDGE0_KEY = process.env.JUDGE0_API_KEY

// Language ID mapping for Judge0
const LANGUAGE_IDS = {
  python:     71,
  javascript: 63,
  java:       62,
  'c++':      54,
  c:          50,
  go:         60,
  rust:       73,
}

const getLanguageId = (lang) =>
  LANGUAGE_IDS[lang?.toLowerCase()] || LANGUAGE_IDS.python

// Submit code to Judge0 and wait for result
const executeCode = async (code, language, stdin = '', expectedOutput = '') => {
  if (!JUDGE0_KEY) {
    // Mock execution when Judge0 not configured
    return mockExecution(code, language)
  }

  try {
    const langId = getLanguageId(language)

    // Submit
    const submitRes = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code:     code,
        language_id:     langId,
        stdin:           stdin,
        expected_output: expectedOutput,
        cpu_time_limit:  2,
        memory_limit:    131072, // 128MB
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': JUDGE0_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
        timeout: 15000,
      }
    )

    const result = submitRes.data
    return parseJudge0Result(result)
  } catch (err) {
    if (err.response?.status === 429) {
      throw new Error('Code execution service rate limit reached')
    }
    throw new Error(`Code execution failed: ${err.message}`)
  }
}

const parseJudge0Result = (result) => ({
  stdout:      (result.stdout || '').trim(),
  stderr:      (result.stderr || result.compile_output || '').trim(),
  status:      result.status?.description || 'Unknown',
  statusId:    result.status?.id,
  runtime:     result.time ? parseFloat(result.time) * 1000 : 0, // ms
  memory:      result.memory || 0, // KB
  passed:      result.status?.id === 3, // 3 = Accepted
  compileError: result.status?.id === 6,
  timeLimit:   result.status?.id === 5,
  memoryLimit: result.status?.id === 11,
})

// Mock execution for development
const mockExecution = (code, language) => {
  const hasOutput = code.includes('print') || code.includes('console.log') || code.includes('System.out')
  return {
    stdout:  hasOutput ? 'Mock output: code executed successfully' : '',
    stderr:  '',
    status:  'Accepted',
    statusId: 3,
    runtime:  Math.random() * 100 + 20,
    memory:   Math.random() * 20 + 5,
    passed:   true,
    mock:     true,
  }
}

// Run code against multiple test cases
const runTestCases = async (code, language, testCases) => {
  const results = []

  for (const tc of testCases) {
    try {
      const result = await executeCode(code, language, tc.input, tc.expectedOutput)
      results.push({
        input:    tc.input,
        expected: tc.expectedOutput,
        output:   result.stdout,
        passed:   result.passed && (result.stdout === tc.expectedOutput?.trim() || tc.expectedOutput === undefined),
        runtime:  result.runtime,
        memory:   result.memory,
        error:    result.stderr || '',
        status:   result.status,
      })
    } catch (err) {
      results.push({
        input:    tc.input,
        expected: tc.expectedOutput,
        output:   '',
        passed:   false,
        error:    err.message,
        status:   'Error',
      })
    }
  }

  const passCount  = results.filter(r => r.passed).length
  const passRate   = (passCount / results.length) * 100
  const avgRuntime = results.reduce((s, r) => s + (r.runtime || 0), 0) / results.length
  const maxMemory  = Math.max(...results.map(r => r.memory || 0))

  return { results, passRate, passCount, totalCases: results.length, avgRuntime, maxMemory }
}

module.exports = { executeCode, runTestCases, getLanguageId, LANGUAGE_IDS }

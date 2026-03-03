const { GoogleGenerativeAI } = require('@google/generative-ai')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const MODELS = {
  flash: 'gemini-2.0-flash',
  flash25: 'gemini-2.5-flash',
  flashLite: 'gemini-2.0-flash-lite',
  pro:   'gemini-2.5-pro',
}

// Fallback chain: if primary model quota is exhausted, try these in order
const FALLBACK_CHAINS = {
  'gemini-2.0-flash':      ['gemini-2.5-flash', 'gemini-2.0-flash-lite'],
  'gemini-2.5-flash':      ['gemini-2.0-flash', 'gemini-2.0-flash-lite'],
  'gemini-2.5-pro':        ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'],
}

const getModel = (modelKey = 'flash') =>
  genAI.getGenerativeModel({ model: MODELS[modelKey] || MODELS.flash })

const getModelByName = (modelName) =>
  genAI.getGenerativeModel({ model: modelName })

// ─── Safe JSON parse ─────────────────────────────────────────────────────────
function extractJSON(text) {
  try {
    // Try direct parse first
    return JSON.parse(text)
  } catch {
    // Extract JSON from markdown code block
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) {
      try { return JSON.parse(match[1].trim()) } catch { /* continue */ }
    }
    // Find first { or [ to last } or ]
    const start = text.indexOf('{') !== -1 ? text.indexOf('{') : text.indexOf('[')
    const end   = text.lastIndexOf('}') !== -1 ? text.lastIndexOf('}') : text.lastIndexOf(']')
    if (start !== -1 && end !== -1) {
      try { return JSON.parse(text.slice(start, end + 1)) } catch { /* failed */ }
    }
    throw new Error('Could not extract JSON from AI response')
  }
}

// ─── Roadmap Generation ──────────────────────────────────────────────────────
const generateRoadmap = async (profile) => {
  const model = getModel('pro')
  const prompt = `Generate a 7-day personalized internship preparation roadmap for the following student profile:
- Year: ${profile.year}
- Branch: ${profile.branch}
- Target Role: ${profile.targetRole}
- Target Companies: ${profile.targetCompanies?.join(', ')}
- Current Skills: ${profile.skills?.map(s => `${s.name}(${s.level}/5)`).join(', ')}
- Available Hours/Week: ${profile.hoursPerWeek}

Return ONLY a valid JSON object with this structure:
{
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "description": "Brief description of the day's focus",
      "tasks": [
        {
          "id": "unique_id",
          "type": "study|quiz|coding|resource|practice",
          "title": "Task title",
          "description": "What to do",
          "duration": 45,
          "difficulty": "easy|medium|hard",
          "resourceUrl": "https://..."
        }
      ],
      "expectedOutcome": "What the student will achieve"
    }
  ]
}`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  return extractJSON(text)
}

// ─── Company-Specific Roadmap ─────────────────────────────────────────────────
const generateCompanyRoadmap = async (company, role) => {
  const model = getModel('flash')
  const prompt = `Generate a concise interview preparation guide for ${company} for a ${role} position.
Return ONLY valid JSON:
{
  "interviewProcess": [{"round": "Round name", "format": "Format", "duration": "Duration", "tips": "Key tips"}],
  "keyTopics": ["topic1", "topic2"],
  "mustDo": [{"category": "Arrays", "problems": ["Two Sum", "Best Time to Buy"]}],
  "resources": [{"title": "Resource", "url": "https://..."}],
  "applicationTimeline": "When to apply and typical timeline"
}`
  const result = await model.generateContent(prompt)
  return extractJSON(result.response.text())
}

// ─── ATS Resume Scoring ───────────────────────────────────────────────────────
const scoreResume = async (resumeText, targetRole) => {
  const model = getModel('flash')
  const prompt = `Analyze this resume for a ${targetRole} position and return ONLY valid JSON:
{
  "overallScore": 75,
  "keywordMatch": 68,
  "formattingScore": 80,
  "contentQuality": 72,
  "lengthScore": 85,
  "suggestions": ["Add more action verbs", "Quantify achievements"],
  "missingKeywords": ["Docker", "CI/CD"],
  "strengths": ["Good technical skills section"],
  "improvements": ["Add measurable impact to projects"]
}

Resume:
${resumeText.slice(0, 3000)}`
  const result = await model.generateContent(prompt)
  return extractJSON(result.response.text())
}

// ─── Resume Bullet Improvement ───────────────────────────────────────────────
const improveBullet = async (bullet, role) => {
  const model = getModel('flash')
  const prompt = `Improve this resume bullet point for a ${role} position. Return 3 alternatives.
Original: "${bullet}"
Return ONLY valid JSON: {"alternatives": ["improved v1", "improved v2", "improved v3"]}`
  const result = await model.generateContent(prompt)
  return extractJSON(result.response.text())
}

// ─── Resume Summary Generation ────────────────────────────────────────────────
const generateResumeSummary = async (profile) => {
  const model = getModel('flash')
  const prompt = `Write a professional resume summary (3-4 sentences) for:
- Role: ${profile.targetRole}
- Skills: ${profile.skills?.map(s => s.name).join(', ')}
- Year: ${profile.year} ${profile.branch} student
Return ONLY valid JSON: {"summary": "Professional summary text here"}`
  const result = await model.generateContent(prompt)
  return extractJSON(result.response.text())
}

// ─── Resume JD Comparison ─────────────────────────────────────────────────────
const compareResumeWithJD = async (resumeText, jobDescription) => {
  const model = getModel('flash')
  const prompt = `Compare this resume against the job description.
Return ONLY valid JSON:
{
  "matchScore": 72,
  "presentKeywords": ["Python", "React"],
  "missingKeywords": ["Kubernetes", "GraphQL"],
  "recommendations": ["Add Kubernetes experience", "Mention GraphQL projects"],
  "summary": "Overall assessment"
}

Job Description:
${jobDescription.slice(0, 1500)}

Resume:
${resumeText.slice(0, 2000)}`
  const result = await model.generateContent(prompt)
  return extractJSON(result.response.text())
}

// ─── Comprehensive Resume PDF Analysis ────────────────────────────────────────
const analyzeResumePDF = async (resumeText, targetRole) => {
  const model = getModel('flash')
  const prompt = `You are an expert ATS (Applicant Tracking System) analyzer and career coach. Analyze this resume for a "${targetRole || 'Software Engineer'}" role.

Return ONLY valid JSON with this EXACT structure:
{
  "atsScore": 72,
  "sectionScores": {
    "contactInfo": { "score": 90, "feedback": "Brief feedback" },
    "summary": { "score": 60, "feedback": "Brief feedback" },
    "experience": { "score": 70, "feedback": "Brief feedback" },
    "education": { "score": 85, "feedback": "Brief feedback" },
    "skills": { "score": 75, "feedback": "Brief feedback" },
    "projects": { "score": 65, "feedback": "Brief feedback" },
    "formatting": { "score": 80, "feedback": "Brief feedback" }
  },
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "criticalIssues": ["Issue that must be fixed 1", "Issue 2"],
  "suggestions": [
    { "priority": "high", "category": "content", "text": "Specific actionable suggestion" },
    { "priority": "high", "category": "keywords", "text": "Specific actionable suggestion" },
    { "priority": "medium", "category": "formatting", "text": "Specific actionable suggestion" },
    { "priority": "medium", "category": "impact", "text": "Specific actionable suggestion" },
    { "priority": "low", "category": "polish", "text": "Specific actionable suggestion" }
  ],
  "missingKeywords": ["keyword1", "keyword2", "keyword3"],
  "presentKeywords": ["keyword1", "keyword2"],
  "actionVerbs": { "found": ["Built", "Designed"], "suggested": ["Spearheaded", "Architected", "Optimized"] },
  "quantificationCheck": { "hasMetrics": false, "examples": ["Add: Improved API response time by 40%", "Add: Served 10K+ daily users"] },
  "overallFeedback": "2-3 sentence overall assessment of the resume"
}

Resume text:
${resumeText.slice(0, 4000)}`

  const result = await callGeminiWithRetry(model, prompt)
  return extractJSON(result.response.text())
}

// ─── Code Evaluation ──────────────────────────────────────────────────────────
const evaluateCode = async (problem, code, language, testResults) => {
  const model = getModel('flash')
  const passRate = testResults.filter(t => t.passed).length / testResults.length * 100
  const prompt = `Evaluate this ${language} solution for the problem: "${problem.title}".
Pass rate: ${passRate.toFixed(0)}%

Code:
\`\`\`${language}
${code.slice(0, 2000)}
\`\`\`

Return ONLY valid JSON:
{
  "correctnessScore": 85,
  "codeQualityScore": 78,
  "timeComplexity": "O(n log n)",
  "spaceComplexity": "O(n)",
  "suggestions": ["Use HashMap instead of nested loops", "Add comments"],
  "optimalSolution": "Brief description of optimal approach",
  "overallGrade": "B+"
}`
  const result = await callGeminiWithRetry(model, prompt)
  return extractJSON(result.response.text())
}

// ─── Retry helper for Gemini rate limits with model fallback ─────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function callGeminiWithRetry(model, prompt, maxRetries = 2) {
  // Determine the primary model name from the model object (strip "models/" prefix)
  const rawName = model?.model || model?.modelName || ''
  const primaryModelName = rawName.replace(/^models\//, '')

  // Build list of models to try: primary + fallbacks
  const modelsToTry = [model]
  const fallbacks = FALLBACK_CHAINS[primaryModelName] || FALLBACK_CHAINS['gemini-2.0-flash'] || []
  for (const fbName of fallbacks) {
    modelsToTry.push(getModelByName(fbName))
  }

  let lastError = null

  for (let modelIdx = 0; modelIdx < modelsToTry.length; modelIdx++) {
    const currentModel = modelsToTry[modelIdx]
    const modelLabel = modelIdx === 0 ? primaryModelName || 'primary' : (fallbacks[modelIdx - 1] || `fallback-${modelIdx}`)

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await currentModel.generateContent(prompt)
        if (modelIdx > 0) {
          console.log(`✅ Gemini fallback model "${modelLabel}" succeeded`)
        }
        return result
      } catch (err) {
        lastError = err
        const is429 = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('Too Many Requests')
        const is503 = err.message?.includes('503') || err.message?.includes('overloaded')

        if (is429 || is503) {
          if (attempt < maxRetries) {
            const delay = Math.min(2000 * Math.pow(2, attempt), 10000)
            console.log(`⚠️  Gemini "${modelLabel}" rate limited (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`)
            await sleep(delay)
            continue
          }
          // Exhausted retries for this model — try next fallback
          if (modelIdx < modelsToTry.length - 1) {
            console.log(`🔄 Gemini "${modelLabel}" quota exhausted, switching to fallback "${fallbacks[modelIdx] || 'next'}"...`)
            break // break inner retry loop, continue outer model loop
          }
        }

        // Non-rate-limit error — throw immediately
        if (!is429 && !is503) {
          throw err
        }
      }
    }
  }

  // All models and retries exhausted
  throw lastError || new Error('All Gemini models exhausted — please try again later')
}

// ─── Quiz Question Generation ─────────────────────────────────────────────────
const generateQuizQuestions = async (topic, difficulty, count = 10, userProfile = {}) => {
  const model = getModel('flash')
  const profileCtx = userProfile.targetRole
    ? `\nStudent profile:\n- Target Role: ${userProfile.targetRole}\n- Year: ${userProfile.year || 'N/A'}\n- Branch: ${userProfile.branch || 'N/A'}\n- Target Companies: ${(userProfile.targetCompanies || []).join(', ') || 'N/A'}\n- Known Skills: ${(userProfile.skills || []).map(s => s.name).join(', ') || 'N/A'}\n\nTailor questions to be relevant for someone preparing for ${userProfile.targetRole} interviews at these companies.`
    : ''
  const prompt = `Generate ${count} ${difficulty} ${topic} multiple choice questions for a CS placement exam.${profileCtx}

Requirements:
- Questions must be exactly ${difficulty} difficulty level
- Include a good mix of conceptual and applied questions
- Each question must have exactly 4 options
- Correct answer must be one of the options (exact text match)

Return ONLY a valid JSON array:
[{
  "question": "Question text?",
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "correct": "Option B text",
  "explanation": "Why this answer is correct",
  "subtopic": "Specific subtopic"
}]`
  const result = await callGeminiWithRetry(model, prompt)
  return extractJSON(result.response.text())
}

// ─── Mock Interview ───────────────────────────────────────────────────────────
const interviewChat = async (messages, config) => {
  const model = getModel('pro')
  const systemPrompt = `You are a senior ${config.difficulty} level interviewer at ${config.company || 'a top tech company'} conducting a ${config.type} interview for a ${config.role || 'Software Engineer'} position.

Rules:
- Ask one question at a time
- Keep acknowledgments brief (1 sentence max)
- Progress naturally from introductory to technical questions
- After the last question, say "Thank you for your time. The interview is now complete." to signal the end
- Be professional but encouraging
- For technical questions, probe deeper if the answer is incomplete`

  const chatHistory = messages.map(m => ({
    role: m.role === 'interviewer' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const chat = model.startChat({
    history: [{ role: 'user', parts: [{ text: systemPrompt }] }, { role: 'model', parts: [{ text: "Understood. I'm ready to conduct the interview." }] }, ...chatHistory.slice(0, -1)],
  })

  const lastMsg = messages[messages.length - 1]
  const result = await chat.sendMessage(lastMsg.content)
  return result.response.text()
}

// ─── Interview Report Generation ─────────────────────────────────────────────
const generateInterviewReport = async (messages, config) => {
  if (!messages || !messages.length) {
    throw new Error('No interview conversation to analyze')
  }
  const model = getModel('flash')
  const conversation = messages.map(m => `${m.role}: ${m.content}`).join('\n\n')
  const prompt = `Analyze this ${config.type} mock interview and generate a detailed feedback report.
Return ONLY valid JSON:
{
  "overallScore": 78,
  "technicalAccuracy": 75,
  "communication": 82,
  "problemSolving": 70,
  "confidence": 80,
  "relevance": 85,
  "strengths": ["Clear communication", "Good problem breakdown"],
  "improvements": ["Practice more DP problems", "Structure answers better"],
  "resources": ["LeetCode DP section", "System Design Primer"],
  "perQuestionScores": [{"question": "Q1 text", "score": 80, "idealAnswer": "Better answer"}]
}

Interview:
${conversation.slice(0, 4000)}`
  const result = await callGeminiWithRetry(model, prompt)
  return extractJSON(result.response.text())
}

// ─── Soft Skills Feedback ─────────────────────────────────────────────────────
const evaluateSoftSkill = async (module, userResponse, context) => {
  const model = getModel('flash')
  const prompt = `Evaluate this student's response for the "${module}" soft skills module.
Context: ${context}
Response: ${userResponse}
Return ONLY valid JSON:
{
  "score": 78,
  "feedback": "Detailed feedback here",
  "strengths": ["Point 1"],
  "improvements": ["Area 1"],
  "improvedVersion": "A better version of their response"
}`
  const result = await model.generateContent(prompt)
  return extractJSON(result.response.text())
}

// ─── Soft Skills Voice Report ─────────────────────────────────────────────────
const generateSoftSkillReport = async (messages, moduleId) => {
  const model = getModel('flash')
  const conversation = messages.map(m => `${m.role === 'user' ? 'Student' : 'Coach'}: ${m.content}`).join('\n\n')
  const prompt = `Analyze this soft skills voice practice session for the "${moduleId}" module and generate a detailed feedback report.
Return ONLY valid JSON:
{
  "overallScore": 78,
  "communication": 80,
  "clarity": 75,
  "professionalism": 82,
  "confidence": 70,
  "relevance": 85,
  "strengths": ["Clear articulation", "Good examples used"],
  "improvements": ["Use more specific examples", "Structure answers with STAR method"],
  "tips": ["Practice speaking slowly and clearly", "Record yourself and listen back"],
  "summary": "Overall assessment of the session"
}

Conversation:
${conversation.slice(0, 4000)}`
  const result = await callGeminiWithRetry(model, prompt)
  return extractJSON(result.response.text())
}

// ─── Analytics Insights ───────────────────────────────────────────────────────
const generateInsights = async (userData) => {
  const model = getModel('flash')
  const prompt = `Generate personalized placement preparation insights for this student:
- Overall Score: ${userData.overallScore}/100
- Coding Score: ${userData.scores?.coding || 0}
- Quiz Score: ${userData.scores?.quiz || 0}
- Target Role: ${userData.targetRole}
- Target Companies: ${userData.targetCompanies?.join(', ')}
- Days Remaining: ${7 - userData.sprintDay}

Return ONLY valid JSON:
{
  "weekSummary": "Brief performance summary",
  "predictions": [{"company": "Google", "readiness": 71}],
  "focusAreas": ["System Design", "Dynamic Programming"],
  "motivationalMessage": "Encouraging message",
  "tips": ["Specific actionable tip 1", "Tip 2"]
}`
  const result = await model.generateContent(prompt)
  return extractJSON(result.response.text())
}

module.exports = {
  generateRoadmap,
  generateCompanyRoadmap,
  scoreResume,
  analyzeResumePDF,
  improveBullet,
  generateResumeSummary,
  compareResumeWithJD,
  evaluateCode,
  generateQuizQuestions,
  interviewChat,
  generateInterviewReport,
  evaluateSoftSkill,
  generateSoftSkillReport,
  generateInsights,
}

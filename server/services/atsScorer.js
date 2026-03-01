const { scoreResume: geminiScoreResume } = require('./geminiService')

// ATS keyword scoring
const ATS_KEYWORDS_BY_ROLE = {
  'Software Engineer':   ['algorithms', 'data structures', 'REST', 'API', 'SQL', 'Git', 'CI/CD', 'microservices', 'testing'],
  'Data Scientist':      ['Python', 'machine learning', 'statistics', 'SQL', 'pandas', 'sklearn', 'deep learning', 'data analysis'],
  'Frontend Developer':  ['React', 'JavaScript', 'CSS', 'HTML', 'TypeScript', 'webpack', 'responsive', 'accessibility'],
  'Backend Developer':   ['Node.js', 'REST', 'database', 'API', 'authentication', 'caching', 'microservices', 'Docker'],
  'Full Stack Developer':['React', 'Node.js', 'MongoDB', 'REST', 'Git', 'Docker', 'authentication', 'deployment'],
  'DevOps Engineer':     ['Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'AWS', 'Terraform', 'monitoring', 'Linux'],
  'ML Engineer':         ['Python', 'TensorFlow', 'PyTorch', 'model deployment', 'MLOps', 'feature engineering', 'deep learning'],
  'Product Manager':     ['product roadmap', 'user stories', 'KPI', 'stakeholder', 'agile', 'market research', 'OKR'],
}

// Check resume formatting
const checkFormatting = (resumeText) => {
  let score = 100
  const issues = []

  // Length check
  const wordCount = resumeText.split(/\s+/).length
  if (wordCount < 200) { score -= 20; issues.push('Resume too short (under 200 words)') }
  if (wordCount > 900) { score -= 10; issues.push('Resume too long (over 900 words for entry level)') }

  // Action verbs
  const actionVerbs = ['developed', 'built', 'implemented', 'designed', 'led', 'improved', 'optimized', 'created', 'managed', 'delivered']
  const hasActionVerbs = actionVerbs.filter(v => resumeText.toLowerCase().includes(v))
  if (hasActionVerbs.length < 3) { score -= 15; issues.push('Add more action verbs') }

  // Quantification
  const hasNumbers = /\d+[%x+]|\d+ (users|projects|teams|systems|percent)/i.test(resumeText)
  if (!hasNumbers) { score -= 10; issues.push('Quantify your achievements with numbers') }

  // Contact info
  const hasEmail = /@/.test(resumeText)
  if (!hasEmail) { score -= 5; issues.push('Add email address') }

  // Section headers
  const sections = ['experience', 'education', 'skills', 'projects']
  const presentSections = sections.filter(s => resumeText.toLowerCase().includes(s))
  if (presentSections.length < 3) { score -= 10; issues.push('Add key sections: Experience, Education, Skills, Projects') }

  return { score: Math.max(0, score), issues }
}

// Keyword match scoring
const checkKeywords = (resumeText, targetRole) => {
  const keywords = ATS_KEYWORDS_BY_ROLE[targetRole] || ATS_KEYWORDS_BY_ROLE['Software Engineer']
  const resumeLower = resumeText.toLowerCase()

  const present = keywords.filter(k => resumeLower.includes(k.toLowerCase()))
  const missing = keywords.filter(k => !resumeLower.includes(k.toLowerCase()))
  const score = Math.round((present.length / keywords.length) * 100)

  return { score, present, missing }
}

// Main ATS scorer — uses Gemini for detailed analysis
const scoreATS = async (resumeText, targetRole) => {
  try {
    // Quick local scoring first
    const { score: formatScore, issues: formatIssues } = checkFormatting(resumeText)
    const { score: kwScore, present: kwPresent, missing: kwMissing } = checkKeywords(resumeText, targetRole)

    // Gemini-powered deep analysis
    const geminiResult = await geminiScoreResume(resumeText, targetRole)

    // Combine scores
    const overallScore = Math.round(
      (geminiResult.overallScore || kwScore) * 0.6 +
      formatScore * 0.4
    )

    return {
      overallScore:    Math.min(100, overallScore),
      keywordMatch:    geminiResult.keywordMatch || kwScore,
      formattingScore: geminiResult.formattingScore || formatScore,
      contentQuality:  geminiResult.contentQuality || 70,
      lengthScore:     geminiResult.lengthScore || 80,
      suggestions:     [...(geminiResult.suggestions || []), ...formatIssues].slice(0, 8),
      missingKeywords: geminiResult.missingKeywords || kwMissing,
      presentKeywords: kwPresent,
      strengths:       geminiResult.strengths || [],
      improvements:    geminiResult.improvements || [],
    }
  } catch {
    // Fallback to local scoring only
    const { score: formatScore, issues: formatIssues } = checkFormatting(resumeText)
    const { score: kwScore, present, missing } = checkKeywords(resumeText, targetRole)
    const overallScore = Math.round((kwScore + formatScore) / 2)

    return {
      overallScore,
      keywordMatch:    kwScore,
      formattingScore: formatScore,
      contentQuality:  70,
      lengthScore:     80,
      suggestions:     formatIssues,
      missingKeywords: missing,
      presentKeywords: present,
    }
  }
}

module.exports = { scoreATS, checkFormatting, checkKeywords }

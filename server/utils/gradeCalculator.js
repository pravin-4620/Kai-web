// Grade thresholds
const GRADES = [
  { min: 90, grade: 'A+', label: 'Expert' },
  { min: 80, grade: 'A',  label: 'Advanced' },
  { min: 70, grade: 'B+', label: 'Proficient' },
  { min: 60, grade: 'B',  label: 'Developing' },
  { min: 50, grade: 'C',  label: 'Beginner' },
  { min: 0,  grade: 'D',  label: 'Needs Work' },
]

const getGrade = (score) =>
  GRADES.find((g) => score >= g.min) || GRADES[GRADES.length - 1]

// Overall score formula
const calculateOverallScore = (scores = {}) => {
  const { coding = 0, quiz = 0, interview = 0, softSkills = 0, streak = 0, resume = 0 } = scores
  return Math.round(
    coding     * 0.35 +
    quiz       * 0.25 +
    interview  * 0.20 +
    softSkills * 0.10 +
    Math.min(streak * 10, 100) * 0.05 +
    resume     * 0.05
  )
}

// Clamp number between 0-100
const clamp100 = (n) => Math.min(100, Math.max(0, n))

module.exports = { getGrade, calculateOverallScore, clamp100, GRADES }

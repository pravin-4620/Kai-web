import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

// Tailwind class merger
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Grade helpers
export const GRADE_THRESHOLDS = [
  { min: 90, grade: 'A+', label: 'Expert',     color: 'text-accent-cyan',   bg: 'bg-accent-cyan/20' },
  { min: 80, grade: 'A',  label: 'Advanced',   color: 'text-accent-green',  bg: 'bg-accent-green/20' },
  { min: 70, grade: 'B+', label: 'Proficient', color: 'text-accent-blue',   bg: 'bg-accent-blue/20' },
  { min: 60, grade: 'B',  label: 'Developing', color: 'text-accent-purple', bg: 'bg-accent-purple/20' },
  { min: 50, grade: 'C',  label: 'Beginner',   color: 'text-accent-orange', bg: 'bg-accent-orange/20' },
  { min: 0,  grade: 'D',  label: 'Needs Work', color: 'text-accent-red',    bg: 'bg-accent-red/20' },
]

export function getGrade(score) {
  return GRADE_THRESHOLDS.find((t) => score >= t.min) || GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1]
}

export function gradeColor(grade) {
  const entry = GRADE_THRESHOLDS.find((t) => t.grade === grade)
  return entry?.color || 'text-text-secondary'
}

// Score formula: Coding×0.35 + Quizzes×0.25 + Interview×0.20 + SoftSkills×0.10 + Streak×0.05 + Resume×0.05
export function calculateOverallScore({ coding = 0, quiz = 0, interview = 0, softSkills = 0, streak = 0, resume = 0 }) {
  return Math.round(
    coding * 0.35 +
    quiz * 0.25 +
    interview * 0.20 +
    softSkills * 0.10 +
    streak * 0.05 +
    resume * 0.05
  )
}

// Difficulty badge
export function difficultyClass(level) {
  const map = {
    easy:   'difficulty-easy',
    medium: 'difficulty-medium',
    hard:   'difficulty-hard',
  }
  return map[level?.toLowerCase()] || 'badge-chip bg-bg-tertiary text-text-secondary'
}

// Date helpers
export function timeAgo(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDate(date, fmt = 'MMM d, yyyy') {
  return format(new Date(date), fmt)
}

export function formatTime(date, fmt = 'h:mm a') {
  return format(new Date(date), fmt)
}

// Sprint day helper
export function getSprintDay(startDate) {
  if (!startDate) return 1
  const diff = Math.floor((Date.now() - new Date(startDate)) / 86400000)
  return Math.min(Math.max(diff + 1, 1), 7)
}

// Truncate text
export function truncate(str, n = 100) {
  if (!str) return ''
  return str.length > n ? str.slice(0, n) + '…' : str
}

// Capitalize
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Random greeting
const GREETINGS = [
  "Let's crush it today!",
  "Your dream company is waiting!",
  "Every line of code counts!",
  "Stay focused, stay sharp!",
  "7 days to greatness!",
]
export function getGreeting(name) {
  const hour = new Date().getHours()
  const timeGreet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const motivation = GREETINGS[Math.floor(Math.random() * GREETINGS.length)]
  return `${timeGreet}, ${name?.split(' ')[0] || 'Student'}! ${motivation}`
}

// Debounce
export function debounce(fn, delay = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// Format milliseconds
export function formatMs(ms) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

// Format bytes
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Validate email
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Number animation helper
export function animateNumber(from, to, duration, callback) {
  const startTime = performance.now()
  const diff = to - from
  function step(currentTime) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    callback(Math.round(from + diff * eased))
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// Company slugify
export function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Local storage helpers
export const ls = {
  get: (key, def = null) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? def } catch { return def }
  },
  set: (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* quota */ }
  },
  remove: (key) => localStorage.removeItem(key),
}

// Top 20 companies list
export const TOP_COMPANIES = [
  'Google', 'Microsoft', 'Amazon', 'Meta', 'Apple',
  'Netflix', 'Goldman Sachs', 'JPMorgan', 'McKinsey', 'Deloitte',
  'Infosys', 'TCS', 'Wipro', 'Accenture', 'Adobe',
  'Salesforce', 'Uber', 'Airbnb', 'Stripe', 'Flipkart',
]

export const BRANCHES = ['CSE', 'ECE', 'IT', 'MECH', 'CIVIL', 'MBA', 'EEE', 'Chemical', 'Biotech', 'Other']

export const TARGET_ROLES = [
  'Software Engineer', 'Data Scientist', 'Product Manager', 'DevOps Engineer',
  'ML Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Business Analyst', 'Cloud Engineer', 'Security Engineer', 'QA Engineer',
]

export const STUDY_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Final Year']

export const CODING_LANGUAGES = ['Python', 'JavaScript', 'Java', 'C++', 'C', 'Go', 'Rust']

// Badge definitions
export const BADGES = {
  first_blood:       { name: 'First Blood',          desc: 'Complete first coding test' },
  on_fire:           { name: 'On Fire',              desc: '3-day streak' },
  diamond_coder:     { name: 'Diamond Coder',        desc: 'Score A+ on 3 coding tests' },
  quiz_master:       { name: 'Quiz Master',          desc: 'Score 90%+ on 5 quizzes' },
  resume_pro:        { name: 'Resume Pro',           desc: 'ATS Score > 85' },
  interview_ready:   { name: 'Interview Ready',      desc: 'Complete mock interview' },
  top_10:            { name: 'Top 10',               desc: 'Reach top 10 in institution' },
  speed_demon:       { name: 'Speed Demon',          desc: 'Solve a problem in under 5 mins' },
  warrior_7day:      { name: '7-Day Warrior',        desc: 'Complete all 7-day tasks' },
  institution_champ: { name: 'Institution Champion', desc: '#1 rank in institution' },
}

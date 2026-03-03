import axios from 'axios'
import { getIdToken } from './firebase'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach Firebase ID token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getIdToken()
      if (token) config.headers.Authorization = `Bearer ${token}`
    } catch (_) {
      // no token, continue anyway
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong'
    const status  = error.response?.status

    if (status === 401) {
      toast.error('Session expired. Please sign in again.')
      window.location.href = '/auth'
    } else if (status === 429) {
      toast.error('Too many requests. Please slow down.')
    } else if (status >= 500) {
      toast.error('Server error. Please try again later.')
    }

    return Promise.reject({ message, status })
  }
)

// ─── User ───────────────────────────────────────────────────────────────────
export const userApi = {
  getMe:              ()       => api.get('/user/me'),
  updateMe:           (data)   => api.patch('/user/me', data),
  completeOnboarding: (data)   => api.post('/user/onboarding', data),
  uploadAvatar:       (formData) => api.post('/user/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getScore:           ()       => api.get('/user/score'),
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  syncUser:  (data) => api.post('/auth/sync', data),
}

// ─── Roadmap ─────────────────────────────────────────────────────────────────
export const roadmapApi = {
  generate:        (profile)    => api.post('/roadmap/generate', profile),
  getMine:         ()           => api.get('/roadmap/mine'),
  updateTask:      (taskId, data) => api.patch(`/roadmap/task/${taskId}`, data),
  getCompanyRoadmap: (company)  => api.get(`/roadmap/company/${encodeURIComponent(company)}`),
  regenerate:      ()           => api.post('/roadmap/regenerate'),
}

// ─── Companies ───────────────────────────────────────────────────────────────
export const companiesApi = {
  getAll:  ()          => api.get('/companies'),
  getOne:  (slug)      => api.get(`/companies/${slug}`),
  getMatch: ()         => api.get('/companies/match'),
}

// ─── Resume ───────────────────────────────────────────────────────────────────
export const resumeApi = {
  analyze:        (formData) => api.post('/resume/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }),
  analyzeText:    (text, targetRole) => api.post('/resume/analyze-text', { text, targetRole }, { timeout: 60000 }),
  getMine:        ()         => api.get('/resume/mine'),
  save:           (data)     => api.post('/resume/save', data),
  getScore:       (resume)   => api.post('/resume/score', { resumeData: resume }),
  improvePoint:   (bullet, context) => api.post('/resume/improve', { bullet, context }),
  generateSummary: (data)    => api.post('/resume/summary', { resumeData: data }),
  compareJD:      (resumeText, jd) => api.post('/resume/compare-jd', { resumeText, jd }),
  getVersions:    ()         => api.get('/resume/versions'),
}

// ─── Coding ───────────────────────────────────────────────────────────────────
export const codingApi = {
  getSession:   ()           => api.get('/coding/session'),
  getProblems:  (filters)    => api.get('/coding/problems', { params: filters }),
  getProblem:   (id)         => api.get(`/coding/problems/${id}`),
  runCode:      (data)       => api.post('/coding/run', data),
  submitCode:   (data)       => api.post('/coding/submit', data),
  getAttempts:  ()           => api.get('/coding/attempts'),
  getAttempt:   (id)         => api.get(`/coding/attempts/${id}`),
  logViolation: (data)       => api.post('/coding/violation', data),
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export const quizApi = {
  getQuiz:      (quizId) => api.get(`/quiz/${quizId}`),
  getSchedule:  ()       => api.get('/quiz/schedule'),
  start:        (slotId) => api.post('/quiz/start', { slotId }),
  submit:       (data)   => api.post('/quiz/submit', data),
  getHistory:   ()       => api.get('/quiz/history'),
  getTopics:    ()       => api.get('/quiz/topics'),
}

// ─── Interview ───────────────────────────────────────────────────────────────
export const interviewApi = {
  start:       (config)  => api.post('/interview/start', config),
  sendMessage: (data)    => api.post('/interview/message', data),
  end:         (sessionId) => api.post(`/interview/end/${sessionId}`),
  getReport:   (sessionId) => api.get(`/interview/report/${sessionId}`),
  getHistory:  ()          => api.get('/interview/history'),
  // Vapi voice interview
  startVoice:  (config)  => api.post('/interview/start-voice', config),
  endVoice:    (sessionId, transcript) => api.post(`/interview/end-voice/${sessionId}`, { transcript }),
}

// ─── Soft Skills ─────────────────────────────────────────────────────────────
export const softSkillsApi = {
  getModules:     ()          => api.get('/softskills/modules'),
  submitExercise: (data)      => api.post('/softskills/submit', data),
  getProgress:    ()          => api.get('/softskills/progress'),
  // Voice session
  startVoice:     (config)    => api.post('/softskills/start-voice', config),
  endVoice:       (sessionId, transcript) => api.post(`/softskills/end-voice/${sessionId}`, { transcript }),
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
export const leaderboardApi = {
  getInstitution: (filters)  => api.get('/leaderboard/institution', { params: filters }),
  getGlobal:      (filters)  => api.get('/leaderboard/global', { params: filters }),
  getRank:        ()         => api.get('/leaderboard/my-rank'),
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export const analyticsApi = {
  getOverview:   ()     => api.get('/analytics/overview'),
  getDailyScore: ()     => api.get('/analytics/daily-scores'),
  getTopics:     ()     => api.get('/analytics/topics'),
  getInsights:   ()     => api.get('/analytics/insights'),
  getHeatmap:    ()     => api.get('/analytics/heatmap'),
}

export default api

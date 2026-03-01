import { useState, useCallback } from 'react'
import { interviewApi, resumeApi, roadmapApi, analyticsApi } from '../lib/api'
import toast from 'react-hot-toast'

export function useAI() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const call = useCallback(async (fn, errorMsg = 'AI request failed') => {
    setLoading(true)
    setError(null)
    try {
      const res = await fn()
      return res.data
    } catch (err) {
      const msg = err.message || errorMsg
      setError(msg)
      toast.error(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Generate roadmap
  const generateRoadmap = useCallback((profile) =>
    call(() => roadmapApi.generate(profile), 'Failed to generate roadmap'),
  [call])

  // Score resume
  const scoreResume = useCallback((text, role) =>
    call(() => resumeApi.getScore(text, role), 'Failed to score resume'),
  [call])

  // Improve resume bullet
  const improveBullet = useCallback((bullet, role) =>
    call(() => resumeApi.improvePoint(bullet, role), 'Failed to improve bullet'),
  [call])

  // Generate resume summary
  const generateSummary = useCallback((profile) =>
    call(() => resumeApi.generateSummary(profile), 'Failed to generate summary'),
  [call])

  // Compare resume with JD
  const compareWithJD = useCallback((resumeText, jd) =>
    call(() => resumeApi.compareJD(resumeText, jd), 'Failed to compare with JD'),
  [call])

  // Get analytics insights
  const getInsights = useCallback(() =>
    call(() => analyticsApi.getInsights(), 'Failed to get AI insights'),
  [call])

  // Send interview message
  const sendInterviewMessage = useCallback((data) =>
    call(() => interviewApi.sendMessage(data), 'Failed to get AI response'),
  [call])

  return {
    loading,
    error,
    generateRoadmap,
    scoreResume,
    improveBullet,
    generateSummary,
    compareWithJD,
    getInsights,
    sendInterviewMessage,
  }
}

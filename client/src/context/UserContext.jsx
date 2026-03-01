import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { userApi } from '../lib/api'
import { useAuthContext } from './AuthContext'
import { calculateOverallScore, getGrade } from '../lib/utils'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const { user, loading: authLoading } = useAuthContext()
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error,   setError]     = useState(null)

  const fetchProfile = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const res = await userApi.getMe()
      setProfile(res.data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && user) fetchProfile()
    if (!user) setProfile(null)
  }, [user, authLoading, fetchProfile])

  const updateProfile = async (data) => {
    try {
      const res = await userApi.updateMe(data)
      setProfile(res.data.user)
      return res.data.user
    } catch (err) {
      throw err
    }
  }

  const completeOnboarding = async (data) => {
    try {
      const res = await userApi.completeOnboarding(data)
      setProfile(res.data.user)
      return res.data.user
    } catch (err) {
      throw err
    }
  }

  // Derived values
  const overallScore = profile
    ? calculateOverallScore({
        coding:     profile.scores?.coding     || 0,
        quiz:       profile.scores?.quiz       || 0,
        interview:  profile.scores?.interview  || 0,
        softSkills: profile.scores?.softSkills || 0,
        streak:     Math.min((profile.streak || 0) * 10, 100),
        resume:     profile.scores?.resume     || 0,
      })
    : 0

  const grade = getGrade(overallScore)?.grade || 'F'
  const isOnboardingComplete = profile?.onboardingComplete || false
  const sprintDay = profile
    ? Math.min(Math.max(
        Math.floor((Date.now() - new Date(profile.sprintStartDate || Date.now())) / 86400000) + 1,
        1), 7)
    : 1

  return (
    <UserContext.Provider value={{
      profile,
      loading,
      error,
      fetchProfile,
      updateProfile,
      completeOnboarding,
      overallScore,
      grade,
      isOnboardingComplete,
      sprintDay,
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUserContext() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUserContext must be used within UserProvider')
  return ctx
}

export default UserContext

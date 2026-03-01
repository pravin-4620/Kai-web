import { useAuthContext } from '../context/AuthContext'
import { useUserContext } from '../context/UserContext'
import {
  signInWithGoogle,
  signInWithGithub,
  signInEmail,
  signUpEmail,
} from '../lib/firebase'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export function useAuth() {
  const { user, loading, signOut, refreshUser } = useAuthContext()
  const { profile, isOnboardingComplete } = useUserContext()
  const navigate = useNavigate()

  const handleAuthSuccess = (isNewUser = false) => {
    if (isNewUser || !isOnboardingComplete) {
      navigate('/onboarding')
    } else {
      navigate('/dashboard')
    }
  }

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithGoogle()
      const isNew = result._tokenResponse?.isNewUser || false
      toast.success('Signed in with Google!')
      handleAuthSuccess(isNew)
      return result
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error(err.message || 'Google sign-in failed')
      }
      throw err
    }
  }

  const loginWithGithub = async () => {
    try {
      const result = await signInWithGithub()
      const isNew = result._tokenResponse?.isNewUser || false
      toast.success('Signed in with GitHub!')
      handleAuthSuccess(isNew)
      return result
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error(err.message || 'GitHub sign-in failed')
      }
      throw err
    }
  }

  const loginWithEmail = async (email, password) => {
    try {
      const result = await signInEmail(email, password)
      toast.success('Welcome back!')
      handleAuthSuccess(false)
      return result
    } catch (err) {
      const messages = {
        'auth/user-not-found':  'No account found with this email.',
        'auth/wrong-password':  'Incorrect password.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/invalid-credential': 'Invalid email or password.',
      }
      toast.error(messages[err.code] || err.message)
      throw err
    }
  }

  const registerWithEmail = async (email, password) => {
    try {
      const result = await signUpEmail(email, password)
      toast.success('Account created! Please check your email for verification.')
      navigate('/onboarding')
      return result
    } catch (err) {
      const messages = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-email': 'Please enter a valid email address.',
      }
      toast.error(messages[err.code] || err.message)
      throw err
    }
  }

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isOnboardingComplete,
    loginWithGoogle,
    loginWithGithub,
    loginWithEmail,
    registerWithEmail,
    signOut,
    refreshUser,
  }
}

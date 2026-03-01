import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthChange, logOut } from '../lib/firebase'
import { authApi } from '../lib/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Sync Firebase user with our MongoDB backend
          const res = await authApi.syncUser({
            uid:      firebaseUser.uid,
            email:    firebaseUser.email,
            name:     firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            provider: firebaseUser.providerData[0]?.providerId,
          })
          setUser({ ...firebaseUser, dbUser: res.data.user })
        } catch {
          // Still set the firebase user even if sync fails
          setUser(firebaseUser)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const signOut = async () => {
    try {
      await logOut()
      setUser(null)
      toast.success('Signed out successfully')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  const refreshUser = async () => {
    if (!user) return
    try {
      const res = await authApi.syncUser({
        uid:      user.uid,
        email:    user.email,
        name:     user.displayName,
        photoURL: user.photoURL,
      })
      setUser((prev) => ({ ...prev, dbUser: res.data.user }))
    } catch { /* silent */ }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}

export default AuthContext

import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged,
} from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app     = initializeApp(firebaseConfig)
export const auth    = getAuth(app)
export const storage = getStorage(app)

const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('profile')
googleProvider.addScope('email')

const githubProvider = new GithubAuthProvider()
githubProvider.addScope('user:email')

// Auth helpers
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider)
export const signInWithGithub = () => signInWithPopup(auth, githubProvider)

export const signInEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)

export const signUpEmail = async (email, password) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await sendEmailVerification(cred.user)
  return cred
}

export const logOut = () => signOut(auth)

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback)

export const getIdToken = async () => {
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken()
}

export default app

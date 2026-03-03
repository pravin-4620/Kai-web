import { useState, useContext, useCallback, useMemo, memo } from 'react'
import { Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Github, Chrome, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import AuthContext from '../context/AuthContext'
import { signInWithGoogle, signInWithGithub, signInEmail, signUpEmail } from '../lib/firebase'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { toast } from 'react-hot-toast'

// ✅ Static data moved outside component - prevents recreation
const FIREBASE_MSGS = {
  'auth/email-already-in-use': 'Email already registered. Try signing in.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email.',
}

const FEATURES = [
  'Roadmap with daily execution',
  'Coding + quiz + interview simulation',
  'Resume and readiness scoring',
]

const MODE_OPTIONS = ['signin', 'signup']

// ✅ Animation variants extracted - prevents object recreation
const fadeInUp = { opacity: 0, y: 12 }
const fadeInUpAnimate = { opacity: 1, y: 0 }
const nameFieldVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
}

// ✅ Memoized sub-component for feature list - prevents unnecessary re-renders
const FeatureList = memo(function FeatureList() {
  return (
    <div className="mt-8 space-y-2.5">
      {FEATURES.map((line) => (
        <div key={line} className="flex items-center gap-2 text-sm text-text-primary">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
          {line}
        </div>
      ))}
    </div>
  )
})

// ✅ Memoized sidebar - static content that never changes
const Sidebar = memo(function Sidebar() {
  return (
    <div className="hidden lg:flex border-r border-kai-border p-10 xl:p-14 bg-bg-secondary">
      <div className="max-w-md self-center">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs text-accent-blue bg-accent-blue/10 border border-accent-blue/20 mb-4">
          <ShieldCheck size={12} /> Secure Sign-In
        </div>
        <h1 className="text-3xl xl:text-4xl font-heading font-bold tracking-tight text-text-primary leading-tight">
          Continue your placement sprint with KAI
        </h1>
        <p className="text-text-muted text-sm mt-4 leading-relaxed">
          Manage daily goals, complete assessments, and track readiness from one workspace designed for interview-focused execution.
        </p>
        <FeatureList />
      </div>
    </div>
  )
})

// ✅ Memoized mobile header
const MobileHeader = memo(function MobileHeader() {
  return (
    <div className="text-center mb-6 lg:hidden">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-950 mb-3 text-white font-bold text-sm">
        K
      </div>
      <h1 className="text-xl font-bold text-text-primary">Welcome to KAI</h1>
      <p className="text-text-muted text-sm mt-1">Structured preparation workspace</p>
    </div>
  )
})

// ✅ Memoized mode toggle buttons
const ModeToggle = memo(function ModeToggle({ mode, onModeChange }) {
  return (
    <div className="flex rounded-lg bg-bg-tertiary border border-kai-border p-1 mb-5">
      {MODE_OPTIONS.map((m) => (
        <button
          key={m}
          onClick={() => onModeChange(m)}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === m
            ? 'bg-accent-blue text-white'
            : 'text-text-muted hover:text-text-primary'
            }`}
        >
          {m === 'signin' ? 'Sign In' : 'Create Account'}
        </button>
      ))}
    </div>
  )
})

// ✅ Memoized password toggle button
const PasswordToggle = memo(function PasswordToggle({ showPwd, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="hover:text-text-primary transition-colors"
    >
      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  )
})

export default function AuthPage() {
  const { user, loading } = useContext(AuthContext)
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [busy, setBusy] = useState('')

  // ✅ Memoized icon elements - prevents recreation
  const mailIcon = useMemo(() => <Mail size={14} />, [])
  const chromeIcon = useMemo(() => <Chrome size={15} />, [])
  const githubIcon = useMemo(() => <Github size={15} />, [])

  // ✅ Memoized handler with useCallback - stable reference
  const handle = useCallback(async (fn, provider) => {
    setBusy(provider)
    try {
      await fn()
    } catch (err) {
      toast.error(FIREBASE_MSGS[err.code] || err.message || 'Authentication failed')
    } finally {
      setBusy('')
    }
  }, [])

  // ✅ Memoized email handler
  const handleEmail = useCallback(() => {
    if (!email || !password) {
      toast.error('Fill in all fields')
      return
    }
    if (mode === 'signup' && !name) {
      toast.error('Enter your name')
      return
    }
    handle(
      () => (mode === 'signup' ? signUpEmail(email, password) : signInEmail(email, password)),
      'email'
    )
  }, [email, password, mode, name, handle])

  // ✅ Memoized OAuth handlers - stable references for Button components
  const handleGoogle = useCallback(() => handle(signInWithGoogle, 'google'), [handle])
  const handleGithub = useCallback(() => handle(signInWithGithub, 'github'), [handle])

  // ✅ Memoized input handlers - prevents child re-renders
  const handleEmailChange = useCallback((e) => setEmail(e.target.value), [])
  const handlePasswordChange = useCallback((e) => setPassword(e.target.value), [])
  const handleNameChange = useCallback((e) => setName(e.target.value), [])
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') handleEmail()
    },
    [handleEmail]
  )
  const togglePassword = useCallback(() => setShowPwd((v) => !v), [])

  // ✅ Memoized password toggle component
  const passwordToggle = useMemo(
    () => <PasswordToggle showPwd={showPwd} onToggle={togglePassword} />,
    [showPwd, togglePassword]
  )

  // ✅ Early return after hooks (React rules compliant)
  if (!loading && user) return <Navigate to="/dashboard" replace />

  const isSignUp = mode === 'signup'
  const buttonText = isSignUp ? 'Create Account' : 'Sign In'

  return (
    <div className="min-h-screen bg-bg-primary grid lg:grid-cols-2">
      <Sidebar />

      <div className="flex items-center justify-center px-4 py-8">
        <motion.div
          initial={fadeInUp}
          animate={fadeInUpAnimate}
          className="w-full max-w-md"
        >
          <MobileHeader />

          <div className="card p-6">
            <ModeToggle mode={mode} onModeChange={setMode} />

            <div className="space-y-2.5 mb-5">
              <Button
                variant="secondary"
                className="w-full"
                loading={busy === 'google'}
                onClick={handleGoogle}
                leftIcon={chromeIcon}
              >
                Continue with Google
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                loading={busy === 'github'}
                onClick={handleGithub}
                leftIcon={githubIcon}
              >
                Continue with GitHub
              </Button>
            </div>

            <div className="relative flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-kai-border" />
              <span className="text-[11px] text-text-muted">or use email</span>
              <div className="flex-1 h-px bg-kai-border" />
            </div>

            <div className="space-y-3.5">
              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div
                    key="name-field"
                    variants={nameFieldVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <Input
                      label="Full Name"
                      placeholder="Your full name"
                      value={name}
                      onChange={handleNameChange}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <Input
                label="Email"
                type="email"
                placeholder="you@college.edu"
                value={email}
                onChange={handleEmailChange}
                leftIcon={mailIcon}
              />

              <Input
                label="Password"
                type={showPwd ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={handlePasswordChange}
                onKeyDown={handleKeyDown}
                rightIcon={passwordToggle}
              />

              <Button
                className="w-full"
                loading={busy === 'email'}
                onClick={handleEmail}
              >
                {buttonText}
              </Button>
            </div>

            <p className="text-[11px] text-text-muted text-center mt-4">
              By continuing, you agree to Terms and Privacy Policy.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
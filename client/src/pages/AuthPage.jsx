import { useState, useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Github, Chrome, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import AuthContext from '../context/AuthContext'
import { signInWithGoogle, signInWithGithub, signInEmail, signUpEmail } from '../lib/firebase'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { toast } from 'react-hot-toast'

const FIREBASE_MSGS = {
  'auth/email-already-in-use': 'Email already registered. Try signing in.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email.',
}

export default function AuthPage() {
  const { user, loading } = useContext(AuthContext)
  const [mode, setMode] = useState('signin') // signin | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [busy, setBusy] = useState('')

  if (!loading && user) return <Navigate to="/dashboard" replace />

  const handle = async (fn, provider) => {
    setBusy(provider)
    try {
      await fn()
    } catch (err) {
      toast.error(FIREBASE_MSGS[err.code] || err.message || 'Authentication failed')
    } finally {
      setBusy('')
    }
  }

  const handleEmail = () => {
    if (!email || !password) return toast.error('Fill in all fields')
    if (mode === 'signup' && !name) return toast.error('Enter your name')
    handle(
      () => mode === 'signup' ? signUpEmail(email, password) : signInEmail(email, password),
      'email'
    )
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] grid lg:grid-cols-2">
      <div className="hidden lg:flex border-r border-[#D9E2EC] p-10 xl:p-14 bg-[#FFFFFF]">
        <div className="max-w-md self-center">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs text-[#4F8EF7] bg-[#4F8EF7]/10 border border-[#4F8EF7]/20 mb-4">
            <ShieldCheck size={12} /> Secure Sign-In
          </div>
          <h1 className="text-3xl xl:text-4xl font-heading font-bold tracking-tight text-[#0F172A] leading-tight">
            Continue your placement sprint with KAI
          </h1>
          <p className="text-[#64748B] text-sm mt-4 leading-relaxed">
            Manage daily goals, complete assessments, and track readiness from one workspace designed for interview-focused execution.
          </p>
          <div className="mt-8 space-y-2.5">
            {[
              'Roadmap with daily execution',
              'Coding + quiz + interview simulation',
              'Resume and readiness scoring',
            ].map((line) => (
              <div key={line} className="flex items-center gap-2 text-sm text-[#0F172A]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4F8EF7]" />
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-6 lg:hidden">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[#4F8EF7] to-[#8B5CF6] mb-3 text-white font-bold text-sm">K</div>
            <h1 className="text-xl font-bold text-[#0F172A]">Welcome to KAI</h1>
            <p className="text-[#64748B] text-sm mt-1">Structured preparation workspace</p>
          </div>

          <div className="card p-6 bg-[#FFFFFF]">
            <div className="flex rounded-lg bg-[#F8FAFC] border border-[#D9E2EC] p-1 mb-5">
            {['signin', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === m ? 'bg-[#4F8EF7] text-white' : 'text-[#64748B] hover:text-[#0F172A]'}`}
              >
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

            <div className="space-y-2.5 mb-5">
              <Button
                variant="secondary"
                className="w-full"
                loading={busy === 'google'}
                onClick={() => handle(signInWithGoogle, 'google')}
                leftIcon={<Chrome size={15} />}
              >
                Continue with Google
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                loading={busy === 'github'}
                onClick={() => handle(signInWithGithub, 'github')}
                leftIcon={<Github size={15} />}
              >
                Continue with GitHub
              </Button>
            </div>

            <div className="relative flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-[#D9E2EC]" />
              <span className="text-[11px] text-[#64748B]">or use email</span>
              <div className="flex-1 h-px bg-[#D9E2EC]" />
            </div>

            <div className="space-y-3.5">
              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <Input
                      label="Full Name"
                      placeholder="Your full name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <Input
                label="Email"
                type="email"
                placeholder="you@college.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                leftIcon={<Mail size={14} />}
              />

              <Input
                label="Password"
                type={showPwd ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEmail()}
                rightIcon={
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="hover:text-[#0F172A] transition-colors">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />

              <Button className="w-full" loading={busy === 'email'} onClick={handleEmail}>
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
            </div>

            <p className="text-[11px] text-[#64748B] text-center mt-4">
              By continuing, you agree to Terms and Privacy Policy.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

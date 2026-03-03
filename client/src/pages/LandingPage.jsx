import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Brain, Code2, Trophy, Zap, CheckCircle } from 'lucide-react'
import AuthContext from '../context/AuthContext'
import Button from '../components/ui/Button'

const FEATURES = [
  {
    icon: Brain,
    title: 'Guided 7-Day Plan',
    desc: 'A daily roadmap with focused tasks based on your role and target company.',
    color: '#ffffff',
  },
  {
    icon: Code2,
    title: 'Real Practice Environment',
    desc: 'Coding rounds, quizzes, and interview simulation in one consistent workflow.',
    color: '#d4d4d4',
  },
  {
    icon: Zap,
    title: 'Resume Optimization',
    desc: 'ATS score improvements with practical rewrite suggestions and checkpoints.',
    color: '#ffffff',
  },
  {
    icon: Trophy,
    title: 'Progress Intelligence',
    desc: 'Track growth with weighted scores, grade trends, and readiness visibility.',
    color: '#d4d4d4',
  },
]

const STATS = [
  { value: '10K+', label: 'Students' },
  { value: '50+', label: 'Companies' },
  { value: '95%', label: 'Completion' },
  { value: '7 Days', label: 'Sprint' },
]

export default function LandingPage() {
  const { user } = useContext(AuthContext)
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="max-w-7xl mx-auto px-6">
        <header className="h-16 flex items-center justify-between border-b border-kai-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-950 flex items-center justify-center text-white font-bold text-xs">
              K
            </div>
            <span className="font-heading font-bold text-base tracking-tight">KAI</span>
            <span className="text-[11px] text-text-muted border border-kai-border rounded-full px-2 py-0.5">
              Placement Accelerator
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => (window.location.href = '/auth')}>
              Sign In
            </Button>
            <Button size="sm" onClick={() => (window.location.href = '/auth')}>
              Start Free
            </Button>
          </div>
        </header>

        <main className="py-14 lg:py-20">
          <section className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-blue bg-accent-blue/10 border border-accent-blue/20 rounded-full px-2.5 py-1">
                <CheckCircle size={12} /> AI-assisted, outcome-driven workflow
              </span>
              <h1 className="mt-4 text-4xl md:text-5xl font-bold font-heading leading-tight tracking-tight">
                Build interview readiness in
                <span className="text-accent-blue"> 7 focused days</span>
              </h1>
              <p className="mt-4 text-text-secondary text-base max-w-xl leading-relaxed">
                KAI unifies roadmap execution, coding rounds, resume improvement, and interview practice so your preparation stays structured and measurable.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button size="lg" rightIcon={<ArrowRight size={16} />} onClick={() => (window.location.href = '/auth')}>
                  Launch Your Sprint
                </Button>
                <Button variant="secondary" size="lg">Explore Modules</Button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
              <div className="card p-6 lg:p-7">
                <div className="grid grid-cols-2 gap-3">
                  {STATS.map((s) => (
                    <div key={s.label} className="bg-bg-tertiary border border-kai-border rounded-lg p-4">
                      <div className="text-xl font-bold text-text-primary mb-1">{s.value}</div>
                      <div className="text-xs text-text-muted">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border border-kai-border rounded-lg p-4 bg-bg-tertiary">
                  <p className="text-xs text-text-muted">What you get</p>
                  <ul className="mt-2 space-y-2 text-sm text-text-primary">
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-accent-green" /> Daily plan + task tracking</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-accent-green" /> Score-backed practice workflow</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-accent-green" /> Readiness visibility by module</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </section>

          <section className="mt-16 lg:mt-20">
            <div className="mb-6">
              <h2 className="text-2xl font-bold font-heading tracking-tight">Designed for serious preparation</h2>
              <p className="text-sm text-text-muted mt-1">Professional workflow, not random practice tasks.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {FEATURES.map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="card p-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: `${color}18` }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
                  <p className="text-xs text-text-muted mt-1.5 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

import { useRef, useContext } from 'react'
import { motion } from 'framer-motion'
import { Download, Share2, Trophy, Zap, Flame, Code2, Brain, MessageSquare, FileText, Smile } from 'lucide-react'
import html2canvas from 'html2canvas'
import Sidebar from '../components/dashboard/Sidebar'
import Navbar from '../components/dashboard/Navbar'
import Button from '../components/ui/Button'
import Progress from '../components/ui/Progress'
import UserContext from '../context/UserContext'
import AuthContext from '../context/AuthContext'
import { getGrade } from '../lib/utils'
import { toast } from 'react-hot-toast'

const MODULES = [
  { key: 'coding', label: 'Coding', icon: Code2, color: '#a855f7', weight: '35%' },
  { key: 'quiz', label: 'Quiz', icon: Brain, color: '#eab308', weight: '25%' },
  { key: 'interview', label: 'Interview', icon: MessageSquare, color: '#3b82f6', weight: '20%' },
  { key: 'softSkills', label: 'Soft Skills', icon: Smile, color: '#22c55e', weight: '10%' },
  { key: 'resume', label: 'Resume', icon: FileText, color: '#ef4444', weight: '5%' },
]

function gradeColor(grade) {
  if (!grade) return '#6b7280'
  if (grade.startsWith('A')) return '#22c55e'
  if (grade.startsWith('B')) return '#3b82f6'
  if (grade.startsWith('C')) return '#eab308'
  return '#ef4444'
}

export default function ReadinessCardPage() {
  const cardRef = useRef(null)
  const { profile, overallScore, grade } = useContext(UserContext)
  const { user } = useContext(AuthContext)
  const scores = profile?.scores || {}

  const download = async () => {
    if (!cardRef.current) return
    toast.loading('Generating card...')
    const canvas = await html2canvas(cardRef.current, { scale: 3, backgroundColor: '#0A0E1A' })
    const link = document.createElement('a')
    link.download = `kai-readiness-${profile?.name?.replace(/\s+/g, '-') || 'card'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast.dismiss()
    toast.success('Card downloaded!')
  }

  const shareCard = async () => {
    if (!cardRef.current) return
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: '#0A0E1A' })
      canvas.toBlob(async (blob) => {
        if (navigator.share && blob) {
          await navigator.share({ title: 'My KAI Placement Readiness Card', files: [new File([blob], 'kai-card.png', { type: 'image/png' })] })
        } else {
          download()
        }
      })
    } catch {
      download()
    }
  }

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Readiness Card" />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col items-center">
          <div className="w-full max-w-sm">
            <div className="flex gap-3 mb-6 justify-center">
              <Button leftIcon={<Download size={16} />} onClick={download}>Download PNG</Button>
              <Button variant="secondary" leftIcon={<Share2 size={16} />} onClick={shareCard}>Share</Button>
            </div>

            {/* THE CARD */}
            <motion.div ref={cardRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="w-full aspect-[9/16] max-w-sm mx-auto rounded-3xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0A0E1A 0%, #0f1628 50%, #0A0E1A 100%)', border: '1px solid rgba(59,130,246,0.3)', fontFamily: 'Inter, sans-serif', boxShadow: '0 0 60px rgba(59,130,246,0.15)' }}
            >
              <div className="h-full flex flex-col p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">K</div>
                    <span className="text-white font-bold text-sm">KAI</span>
                  </div>
                  <span className="text-xs text-gray-500">Placement Readiness</span>
                </div>

                {/* Avatar + name */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mb-3 ring-4 ring-blue-500/20">
                    {profile?.name?.charAt(0)?.toUpperCase() || 'K'}
                  </div>
                  <p className="text-white font-bold text-lg">{profile?.name || 'KAI Student'}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{profile?.college || 'Student'}</p>
                  <p className="text-gray-500 text-xs">{profile?.branch} · {profile?.year}</p>
                </div>

                {/* Big score */}
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center">
                    <svg width="120" height="120" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke={gradeColor(grade)} strokeWidth="8"
                        strokeDasharray={`${(overallScore / 100) * 314} 314`} strokeLinecap="round" transform="rotate(-90 60 60)" strokeDashoffset="0" />
                      <text x="60" y="55" textAnchor="middle" fill="white" fontSize="26" fontWeight="bold" dy="0.3em">{Math.round(overallScore ?? 0)}</text>
                      <text x="60" y="77" textAnchor="middle" fill="#94a3b8" fontSize="11">/ 100</text>
                    </svg>
                  </div>
                  <p className="text-4xl font-bold mt-1" style={{ color: gradeColor(grade) }}>{grade || 'F'}</p>
                  <p className="text-gray-400 text-xs">Overall Grade</p>
                </div>

                {/* Module scores */}
                <div className="space-y-2 flex-1">
                  {MODULES.map(({ key, label, icon: Icon, color }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Icon size={12} style={{ color }} className="flex-shrink-0" />
                      <span className="text-xs text-gray-400 w-16">{label}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${scores[key] ?? 0}%`, background: color }} />
                      </div>
                      <span className="text-xs font-semibold text-white w-8 text-right">{Math.round(scores[key] ?? 0)}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-orange-400 text-xs">
                    <Flame size={12} />
                    {profile?.progress?.streak ?? 0} day streak
                  </div>
                  {profile?.badges?.length > 0 && (
                    <div className="flex gap-1">{profile.badges.slice(0, 4).map(b => <span key={b.key} className="text-[9px] font-semibold text-gray-300 px-1.5 py-0.5 rounded bg-white/10">{b.name}</span>)}</div>
                  )}
                  <span className="text-xs text-gray-600">kai.app</span>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}

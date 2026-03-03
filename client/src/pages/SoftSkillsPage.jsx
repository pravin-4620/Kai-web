import { useState, useEffect, useRef, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smile, CheckCircle, Phone, PhoneOff, Mic, MicOff, Clock, FileText, Lightbulb, MessageSquare, Users, Handshake, Briefcase, Presentation, Mail, Star } from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'
import Navbar from '../components/dashboard/Navbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Progress from '../components/ui/Progress'
import { softSkillsApi } from '../lib/api'
import UserContext from '../context/UserContext'
import useVapi from '../hooks/useVapi'
import { toast } from 'react-hot-toast'

const SKILL_MODULES = [
  { id: 'communication',  label: 'Communication Mastery',   icon: MessageSquare, description: 'Practice clear, professional communication' },
  { id: 'emailEtiquette', label: 'Email Etiquette',         icon: Mail,          description: 'Write professional emails & messages' },
  { id: 'starMethod',     label: 'STAR Method',             icon: Star,          description: 'Structure behavioral interview answers' },
  { id: 'bodyLanguage',   label: 'Body Language & Presence', icon: Users,         description: 'Present yourself with confidence' },
  { id: 'negotiation',    label: 'Negotiation Basics',      icon: Handshake,     description: 'Negotiate offers & salary effectively' },
  { id: 'linkedin',       label: 'LinkedIn Optimization',   icon: Briefcase,     description: 'Optimize your professional profile' },
  { id: 'presentation',   label: 'Presentation Skills',     icon: Presentation,  description: 'Deliver compelling pitches & demos' },
]

function formatDuration(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function SoftSkillsPage() {
  const [phase, setPhase] = useState('setup') // setup | calling | processing | report
  const [selectedModule, setSelectedModule] = useState('communication')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  const [moduleProgress, setModuleProgress] = useState({})
  const transcriptEndRef = useRef(null)
  const endingRef = useRef(false)
  const { overallScore } = useContext(UserContext)

  const {
    isCallActive, isConnecting, isMuted, isSpeaking,
    transcript, volumeLevel, callDuration,
    startCall, stopCall, toggleMute, isAvailable,
  } = useVapi()

  const activeModule = SKILL_MODULES.find(m => m.id === selectedModule) || SKILL_MODULES[0]

  // Load module progress on mount
  useEffect(() => {
    softSkillsApi.getProgress()
      .then(r => setModuleProgress(r.data.progress || {}))
      .catch(() => {})
  }, [])

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  // Detect when Vapi call ends naturally
  useEffect(() => {
    if (phase === 'calling' && !isCallActive && !isConnecting && !endingRef.current) {
      const timer = setTimeout(() => {
        if (transcript.length > 0) {
          endingRef.current = true
          handleCallEnded()
        }
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isCallActive, isConnecting, phase])

  const getSystemPrompt = (mod) => {
    const prompts = {
      communication: `You are a professional communication coach conducting a practice session. Ask the candidate to introduce themselves professionally, then give them scenarios like explaining a complex project to a non-technical person, handling a disagreement with a teammate, and delivering difficult feedback. Ask 5-6 questions. Evaluate clarity, tone, and structure.`,
      emailEtiquette: `You are an email communication coach. Walk the candidate through writing professional emails: a follow-up after an interview, declining an offer politely, requesting a meeting with a senior leader, and escalating an issue. Ask them to verbally compose each email. Ask 5-6 questions.`,
      starMethod: `You are a behavioral interview coach specializing in the STAR method (Situation, Task, Action, Result). Ask the candidate common behavioral questions like "Tell me about a time you led a team" and "Describe a conflict at work." Coach them to structure their answers using STAR. Ask 5-6 questions.`,
      bodyLanguage: `You are a presentation and body language coach. Discuss scenarios about making a great first impression, presenting confidently in meetings, handling nervousness, and projecting authority. Ask the candidate how they would handle each situation. Ask 5-6 questions.`,
      negotiation: `You are a negotiation coach helping with salary and offer negotiations. Role-play scenarios: receiving a lowball offer, negotiating remote work, asking for a raise, and comparing multiple offers. Guide them through each. Ask 5-6 questions.`,
      linkedin: `You are a career branding coach focusing on LinkedIn optimization. Discuss their headline, summary, experience descriptions, skills section, and networking strategy. Ask them to verbally craft compelling sections. Ask 5-6 questions.`,
      presentation: `You are a pitch and presentation coach. Have the candidate practice an elevator pitch, a project demo explanation, a "why should we hire you" response, and a technical concept simplification. Evaluate delivery and clarity. Ask 5-6 questions.`,
    }
    return prompts[mod.id] || prompts.communication
  }

  const getFirstMessage = () => {
    const msgs = {
      communication: 'Could you introduce yourself as if you were meeting a hiring manager for the first time?',
      emailEtiquette: 'Let\'s start with this: How would you write a follow-up email after a great interview?',
      starMethod: 'Tell me about a time you had to overcome a significant challenge at work or in a project.',
      bodyLanguage: 'Imagine you\'re walking into an interview room. How would you make a strong first impression?',
      negotiation: 'You just received a job offer but the salary is 15% below your expectation. How would you respond?',
      linkedin: 'What does your current LinkedIn headline say, or what would you want it to say?',
      presentation: 'Give me a 30-second elevator pitch about yourself and what you do.',
    }
    return msgs[selectedModule] || msgs.communication
  }

  const startVoiceSession = async () => {
    setLoading(true)
    endingRef.current = false
    try {
      const { data } = await softSkillsApi.startVoice({ moduleId: selectedModule })
      setSession(data.session)

      await startCall('6771c49c-60fc-4a11-a9a1-d665f5c73e86', {
        firstMessage: `Hello! I'm your ${activeModule.label} coach today. Let's practice some real-world scenarios together. Ready? Let's start — ${getFirstMessage()}`,
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [{
            role: 'system',
            content: `${getSystemPrompt(activeModule)}

Rules:
- Ask one question at a time, then wait for the candidate to respond
- Acknowledge their response briefly and give quick constructive feedback before moving on
- Be warm, encouraging, and professional
- Keep your responses concise — no long monologues
- After the last question, summarize their performance briefly and say "That wraps up our session. Great job practicing today!"
- Never break character or reveal that you are an AI`,
          }],
          temperature: 0.7,
          maxTokens: 200,
        },
        silenceTimeoutSeconds: 30,
        maxDurationSeconds: 900,
        endCallMessage: 'Great session! Thank you for practicing with me today. Goodbye!',
      })

      setPhase('calling')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start voice session')
    } finally {
      setLoading(false)
    }
  }

  const handleEndCall = () => {
    endingRef.current = true
    stopCall()
    if (transcript.length > 0) {
      handleCallEnded()
    } else {
      setPhase('setup')
    }
  }

  const handleCallEnded = async () => {
    setPhase('processing')
    try {
      const { data } = await softSkillsApi.endVoice(session._id, transcript)
      setReport(data.report)
      setModuleProgress(p => ({ ...p, [selectedModule]: data.report?.overallScore || 0 }))
      setPhase('report')
    } catch {
      toast.error('Failed to generate feedback report')
      setPhase('setup')
    }
  }

  const resetSession = () => {
    setPhase('setup')
    setReport(null)
    setSession(null)
    endingRef.current = false
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Soft Skills Lab" />
        <main className="page-main">
          <AnimatePresence mode="wait">

            {/* ── Setup ─────────────────────────────────────────────── */}
            {phase === 'setup' && (
              <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-xl mx-auto">
                <Card>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center">
                      <Smile size={20} className="text-accent-purple" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-text-primary">Voice Practice Session</h2>
                      <p className="text-xs text-text-muted">AI-powered soft skills coaching via voice</p>
                    </div>
                  </div>

                  <p className="text-sm text-text-muted mb-6">
                    Have a real-time voice conversation with an AI coach. Practice communication, negotiation, behavioral answers, and more — just like speaking with a real career mentor.
                  </p>

                  <div className="mb-6">
                    <p className="text-sm font-medium text-text-secondary mb-3">Select Skill Module</p>
                    <div className="grid grid-cols-2 gap-2">
                      {SKILL_MODULES.map(({ id, label, icon: ModIcon }) => {
                        const prog = moduleProgress[id] || 0
                        return (
                          <button key={id} onClick={() => setSelectedModule(id)}
                            className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all relative overflow-hidden ${
                              selectedModule === id
                                ? 'bg-accent-purple/10 border-accent-purple text-accent-purple'
                                : 'border-kai-border text-text-muted hover:border-accent-purple'
                            }`}
                          >
                            <ModIcon size={14} />
                            <span className="flex-1 text-left">{label}</span>
                            {prog > 0 && (
                              <span className="text-[10px] font-bold opacity-60">{prog}%</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Module description */}
                  <div className="mb-6 p-3 rounded-lg bg-accent-purple/5 border border-accent-purple/20">
                    <p className="text-sm text-text-secondary">{activeModule.description}</p>
                  </div>

                  {!isAvailable && (
                    <div className="mb-4 p-3 rounded-lg bg-neutral-800 border border-neutral-800">
                      <p className="text-xs text-neutral-500 font-medium mb-0.5">Voice not configured</p>
                      <p className="text-xs text-neutral-400">Add <code className="bg-neutral-800 px-1 rounded">VITE_VAPI_PUBLIC_KEY</code> to your client <code className="bg-neutral-800 px-1 rounded">.env</code> file to enable voice sessions.</p>
                    </div>
                  )}

                  <Button className="w-full" loading={loading} onClick={startVoiceSession} disabled={!isAvailable || loading} leftIcon={<Phone size={16} />} size="lg">
                    Start Voice Session
                  </Button>
                </Card>
              </motion.div>
            )}

            {/* ── Voice Call Active ─────────────────────────────────── */}
            {phase === 'calling' && (
              <motion.div key="calling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="max-w-2xl mx-auto flex flex-col items-center" style={{ minHeight: 'calc(100vh - 160px)' }}
              >
                {/* Status bar */}
                <div className="flex items-center gap-3 mb-10 mt-2">
                  {isConnecting ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-neutral-300 animate-pulse" />
                      <span className="text-sm text-text-muted">Connecting...</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-accent-purple animate-pulse" />
                      <span className="text-sm text-text-secondary font-medium">Live</span>
                      <span className="text-sm font-mono text-text-primary bg-bg-tertiary px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <Clock size={12} className="text-text-muted" />
                        {formatDuration(callDuration)}
                      </span>
                    </>
                  )}
                </div>

                {/* AI Avatar with speaking animation */}
                <div className="relative mb-6">
                  {isSpeaking && (
                    <>
                      <motion.div
                        className="absolute -inset-4 rounded-full border-2 border-accent-purple/20"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <motion.div
                        className="absolute -inset-8 rounded-full border border-accent-purple/10"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </>
                  )}
                  <div
                    className="absolute -inset-1 rounded-full transition-all duration-200"
                    style={{
                      background: isSpeaking
                        ? `radial-gradient(circle, transparent 55%, rgba(168,85,247,${Math.min(volumeLevel * 0.4, 0.25)}) 100%)`
                        : 'transparent',
                    }}
                  />
                  <motion.div
                    className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-900 to-neutral-950 flex items-center justify-center relative z-10 shadow-lg shadow-purple-400/20"
                    animate={isSpeaking ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                    transition={{ duration: 1.2, repeat: isSpeaking ? Infinity : 0, ease: 'easeInOut' }}
                  >
                    <Smile size={44} className="text-white" />
                  </motion.div>
                </div>

                <h3 className="text-lg font-semibold text-text-primary">KAI Coach</h3>
                <p className="text-sm text-text-muted mb-1">{activeModule.label}</p>
                <p className="text-xs h-4">
                  {isConnecting ? (
                    <span className="text-neutral-400">Setting up session...</span>
                  ) : isSpeaking ? (
                    <motion.span className="text-accent-purple font-medium" animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      Speaking...
                    </motion.span>
                  ) : isCallActive ? (
                    <span className="text-neutral-400">Listening to you...</span>
                  ) : null}
                </p>

                {/* Live Transcript */}
                <div className="w-full mt-8 flex-1 min-h-0 overflow-y-auto max-h-72 space-y-3 px-2 scrollbar-thin">
                  {transcript.length === 0 && isCallActive && (
                    <p className="text-center text-sm text-[#a3a3a3] py-4">Conversation will appear here...</p>
                  )}
                  {transcript.map((t, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2.5 ${t.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${t.role !== 'user' ? 'bg-accent-purple/10' : 'bg-bg-tertiary'}`}>
                        {t.role !== 'user' ? <Smile size={12} className="text-accent-purple" /> : <Mic size={12} className="text-text-muted" />}
                      </div>
                      <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${t.role !== 'user' ? 'bg-bg-tertiary text-[#404040] rounded-tl-sm' : 'bg-accent-purple/10 text-text-primary rounded-tr-sm'}`}>
                        {t.content}
                      </div>
                    </motion.div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>

                {/* Call Controls */}
                <div className="flex items-center gap-6 mt-8 pb-4">
                  <button
                    onClick={toggleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-sm ${isMuted ? 'bg-neutral-800 text-neutral-400 border border-neutral-800' : 'bg-bg-tertiary text-text-secondary border border-kai-border hover:bg-[#262626]'}`}
                    title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  >
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                  <button
                    onClick={handleEndCall}
                    className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all shadow-lg hover:shadow-xl active:scale-95"
                    title="End session"
                  >
                    <PhoneOff size={24} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Processing ────────────────────────────────────────── */}
            {phase === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-bg-tertiary border border-kai-border flex items-center justify-center mx-auto mb-4">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                    <FileText size={28} className="text-accent-purple" />
                  </motion.div>
                </div>
                <h2 className="text-xl font-bold text-text-primary mb-2">Analyzing Your Session</h2>
                <p className="text-sm text-text-muted">Generating detailed feedback report...</p>
                <div className="mt-6 flex justify-center gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-accent-purple"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Report ────────────────────────────────────────────── */}
            {phase === 'report' && report && (
              <motion.div key="report" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto space-y-6">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-xl bg-bg-tertiary border border-kai-border flex items-center justify-center mx-auto mb-3">
                    <Smile size={24} className="text-accent-purple" />
                  </div>
                  <h2 className="text-2xl font-bold text-text-primary">Session Complete</h2>
                  <p className="text-sm text-text-muted mb-1">{activeModule.label}</p>
                  <p className="text-3xl font-bold gradient-text mt-2">{Math.round(report.overallScore ?? 0)}/100</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Communication', score: report.communication },
                    { label: 'Clarity', score: report.clarity },
                    { label: 'Professionalism', score: report.professionalism },
                    { label: 'Confidence', score: report.confidence },
                    { label: 'Relevance', score: report.relevance },
                  ].filter(s => s.score != null).map(({ label, score }) => (
                    <Card key={label} className="p-3">
                      <p className="text-xs text-text-muted mb-1">{label}</p>
                      <p className="text-lg font-bold text-text-primary">{score ?? 0}%</p>
                      <Progress value={score ?? 0} size="sm" className="mt-1" />
                    </Card>
                  ))}
                </div>

                {report.strengths?.length > 0 && (
                  <Card>
                    <p className="text-sm font-semibold text-neutral-400 mb-2 flex items-center gap-1.5"><CheckCircle size={14} /> Strengths</p>
                    <ul className="space-y-1">{report.strengths.map((s, i) => <li key={i} className="text-sm text-text-secondary flex gap-2"><span className="text-accent-purple">+</span>{s}</li>)}</ul>
                  </Card>
                )}

                {report.improvements?.length > 0 && (
                  <Card>
                    <p className="text-sm font-semibold text-neutral-400 mb-2 flex items-center gap-1.5"><Lightbulb size={14} /> Areas to Improve</p>
                    <ul className="space-y-1">{report.improvements.map((s, i) => <li key={i} className="text-sm text-text-secondary flex gap-2"><span className="text-neutral-400">-</span>{s}</li>)}</ul>
                  </Card>
                )}

                {report.tips?.length > 0 && (
                  <Card>
                    <p className="text-sm font-semibold text-neutral-400 mb-2 flex items-center gap-1.5"><Star size={14} /> Pro Tips</p>
                    <ul className="space-y-1">{report.tips.map((s, i) => <li key={i} className="text-sm text-text-secondary flex gap-2"><span className="text-accent-blue">→</span>{s}</li>)}</ul>
                  </Card>
                )}

                <div className="flex gap-3">
                  <Button className="flex-1" onClick={resetSession}>New Session</Button>
                  <Button variant="secondary" className="flex-1" onClick={() => window.location.href = '/analytics'}>View Analytics</Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

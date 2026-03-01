import { useState, useEffect, useRef, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, User, Lock, CheckCircle, Code2, BarChart3, Layers, Monitor, Server, FileText, Lightbulb, Mic, MicOff, PhoneOff, Phone, Clock } from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'
import Navbar from '../components/dashboard/Navbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Progress from '../components/ui/Progress'
import { interviewApi } from '../lib/api'
import UserContext from '../context/UserContext'
import useVapi from '../hooks/useVapi'
import { toast } from 'react-hot-toast'

const ROLE_TYPES = [
  { value: 'software_engineer', label: 'Software Engineer', icon: Code2 },
  { value: 'data_scientist', label: 'Data Scientist', icon: BarChart3 },
  { value: 'product_manager', label: 'Product Manager', icon: Layers },
  { value: 'frontend', label: 'Frontend Dev', icon: Monitor },
  { value: 'backend', label: 'Backend Dev', icon: Server },
]

function formatDuration(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function MockInterviewPage() {
  const [phase, setPhase] = useState('setup') // setup | calling | processing | report
  const [roleType, setRoleType] = useState('software_engineer')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  const transcriptEndRef = useRef(null)
  const endingRef = useRef(false)
  const { overallScore } = useContext(UserContext)

  const {
    isCallActive, isConnecting, isMuted, isSpeaking,
    transcript, volumeLevel, callDuration,
    startCall, stopCall, toggleMute, isAvailable,
  } = useVapi()

  const isLocked = false // grade restriction temporarily disabled
  const roleLabel = ROLE_TYPES.find(r => r.value === roleType)?.label || 'Software Engineer'

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  // Detect when Vapi call ends naturally and process transcript
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

  const startVoiceInterview = async () => {
    setLoading(true)
    endingRef.current = false
    try {
      const { data } = await interviewApi.startVoice({ type: 'technical', role: roleType, difficulty: 'junior' })
      setSession(data.session)

      await startCall('6771c49c-60fc-4a11-a9a1-d665f5c73e86', {
        firstMessage: `Hello! I'm your interviewer today for the ${roleLabel} position. Thank you for joining. Let's get started. Could you please introduce yourself briefly and tell me about your background?`,
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [{
            role: 'system',
            content: `You are a senior interviewer at a top tech company conducting a technical interview for a ${roleLabel} position.

Rules:
- Ask one question at a time, then wait for the candidate to respond
- Acknowledge answers briefly (one sentence) before moving to the next question
- Start with an introductory question, then progress to technical questions
- Ask 5-7 questions total relevant to the ${roleLabel} role
- For technical questions, ask follow-up probes if the answer is vague or incomplete
- Be professional, warm, and encouraging while maintaining interview standards
- Speak naturally and conversationally, as you would in a real interview
- Keep your responses concise — no long monologues
- After the last question, thank the candidate and say "This concludes our interview. Thank you for your time."
- Never break character or reveal that you are an AI`,
          }],
          temperature: 0.7,
          maxTokens: 200,
        },
        silenceTimeoutSeconds: 30,
        maxDurationSeconds: 1200,
        endCallMessage: 'Thank you for your time. The interview is now complete. Goodbye!',
      })

      setPhase('calling')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start voice interview')
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
      const { data } = await interviewApi.endVoice(session._id, transcript)
      setReport(data.report)
      setPhase('report')
    } catch {
      toast.error('Failed to generate interview report')
      setPhase('setup')
    }
  }

  const resetInterview = () => {
    setPhase('setup')
    setReport(null)
    setSession(null)
    endingRef.current = false
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Mock Interview" />
        <main className="page-main">
          <AnimatePresence mode="wait">

            {/* ── Setup ─────────────────────────────────────────────── */}
            {phase === 'setup' && (
              <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-xl mx-auto">
                {isLocked ? (
                  <Card className="text-center py-12">
                    <Lock size={40} className="text-[#CBD5E1] mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-[#0F172A] mb-2">Grade B Required</h2>
                    <p className="text-[#64748B] text-sm">Reach an overall score of 60+ to unlock Mock Interviews.</p>
                    <p className="text-[#94A3B8] text-xs mt-2">Your score: {Math.round(overallScore ?? 0)}/100</p>
                    <Progress value={overallScore ?? 0} max={100} className="mt-4 max-w-xs mx-auto" />
                  </Card>
                ) : (
                  <Card>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                        <Phone size={20} className="text-accent-blue" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-[#0F172A]">Voice Interview</h2>
                        <p className="text-xs text-[#64748B]">AI-powered real-time voice conversation</p>
                      </div>
                    </div>

                    <p className="text-sm text-[#64748B] mb-6">
                      Have a real-time voice conversation with an AI interviewer. Speak naturally, just like a phone interview. You'll be scored on communication, technical depth, problem-solving, and confidence.
                    </p>

                    <div className="mb-6">
                      <p className="text-sm font-medium text-[#475569] mb-3">Select Role</p>
                      <div className="grid grid-cols-2 gap-2">
                        {ROLE_TYPES.map(({ value, label, icon: RoleIcon }) => (
                          <button key={value} onClick={() => setRoleType(value)}
                            className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${roleType === value ? 'bg-accent-blue/10 border-accent-blue text-accent-blue' : 'border-[#D9E2EC] text-[#64748B] hover:border-[#B8C8DB]'}`}
                          >
                            <RoleIcon size={14} />{label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {!isAvailable && (
                      <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-xs text-amber-700 font-medium mb-0.5">Voice not configured</p>
                        <p className="text-xs text-amber-600">Add <code className="bg-amber-100 px-1 rounded">VITE_VAPI_PUBLIC_KEY</code> to your client <code className="bg-amber-100 px-1 rounded">.env</code> file to enable voice interviews.</p>
                      </div>
                    )}

                    <Button className="w-full" loading={loading} onClick={startVoiceInterview} disabled={!isAvailable || loading} leftIcon={<Phone size={16} />} size="lg">
                      Start Voice Interview
                    </Button>
                  </Card>
                )}
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
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-sm text-[#64748B]">Connecting...</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm text-[#475569] font-medium">Live</span>
                      <span className="text-sm font-mono text-[#0F172A] bg-[#F1F5F9] px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <Clock size={12} className="text-[#64748B]" />
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
                        className="absolute -inset-4 rounded-full border-2 border-accent-blue/20"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <motion.div
                        className="absolute -inset-8 rounded-full border border-accent-blue/10"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </>
                  )}
                  <div
                    className="absolute -inset-1 rounded-full transition-all duration-200"
                    style={{
                      background: isSpeaking
                        ? `radial-gradient(circle, transparent 55%, rgba(79,142,247,${Math.min(volumeLevel * 0.4, 0.25)}) 100%)`
                        : 'transparent',
                    }}
                  />
                  <motion.div
                    className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center relative z-10 shadow-lg shadow-blue-500/20"
                    animate={isSpeaking ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                    transition={{ duration: 1.2, repeat: isSpeaking ? Infinity : 0, ease: 'easeInOut' }}
                  >
                    <Bot size={44} className="text-white" />
                  </motion.div>
                </div>

                <h3 className="text-lg font-semibold text-[#0F172A]">KAI Interviewer</h3>
                <p className="text-sm text-[#64748B] mb-1">{roleLabel} Interview</p>
                <p className="text-xs h-4">
                  {isConnecting ? (
                    <span className="text-amber-500">Setting up call...</span>
                  ) : isSpeaking ? (
                    <motion.span className="text-accent-blue font-medium" animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      Speaking...
                    </motion.span>
                  ) : isCallActive ? (
                    <span className="text-green-600">Listening to you...</span>
                  ) : null}
                </p>

                {/* Live Transcript */}
                <div className="w-full mt-8 flex-1 min-h-0 overflow-y-auto max-h-72 space-y-3 px-2 scrollbar-thin">
                  {transcript.length === 0 && isCallActive && (
                    <p className="text-center text-sm text-[#94A3B8] py-4">Conversation transcript will appear here...</p>
                  )}
                  {transcript.map((t, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2.5 ${t.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${t.role === 'interviewer' ? 'bg-accent-blue/10' : 'bg-[#F1F5F9]'}`}>
                        {t.role === 'interviewer' ? <Bot size={12} className="text-accent-blue" /> : <User size={12} className="text-[#64748B]" />}
                      </div>
                      <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${t.role === 'interviewer' ? 'bg-[#F1F5F9] text-[#334155] rounded-tl-sm' : 'bg-accent-blue/10 text-[#0F172A] rounded-tr-sm'}`}>
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
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-sm ${isMuted ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-[#F1F5F9] text-[#475569] border border-[#D9E2EC] hover:bg-[#E2E8F0]'}`}
                    title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  >
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                  <button
                    onClick={handleEndCall}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg hover:shadow-xl active:scale-95"
                    title="End interview"
                  >
                    <PhoneOff size={24} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Processing ────────────────────────────────────────── */}
            {phase === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] border border-[#D9E2EC] flex items-center justify-center mx-auto mb-4">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                    <FileText size={28} className="text-accent-blue" />
                  </motion.div>
                </div>
                <h2 className="text-xl font-bold text-[#0F172A] mb-2">Analyzing Your Interview</h2>
                <p className="text-sm text-[#64748B]">Generating detailed performance report...</p>
                <div className="mt-6 flex justify-center gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-accent-blue"
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
                  <div className="w-14 h-14 rounded-xl bg-[#F1F5F9] border border-[#D9E2EC] flex items-center justify-center mx-auto mb-3">
                    <FileText size={24} className="text-[#4F8EF7]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#0F172A]">Interview Complete</h2>
                  <p className="text-3xl font-bold gradient-text mt-2">{Math.round(report.overallScore ?? 0)}/100</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Communication', score: report.communication },
                    { label: 'Technical', score: report.technicalAccuracy },
                    { label: 'Problem Solving', score: report.problemSolving },
                    { label: 'Confidence', score: report.confidence },
                    { label: 'Relevance', score: report.relevance },
                  ].map(({ label, score }) => (
                    <Card key={label} className="p-3">
                      <p className="text-xs text-[#64748B] mb-1">{label}</p>
                      <p className="text-lg font-bold text-[#0F172A]">{score ?? 0}%</p>
                      <Progress value={score ?? 0} size="sm" className="mt-1" />
                    </Card>
                  ))}
                </div>

                {report.strengths?.length > 0 && (
                  <Card>
                    <p className="text-sm font-semibold text-green-600 mb-2 flex items-center gap-1.5"><CheckCircle size={14} /> Strengths</p>
                    <ul className="space-y-1">{report.strengths.map((s, i) => <li key={i} className="text-sm text-[#475569] flex gap-2"><span className="text-green-500">+</span>{s}</li>)}</ul>
                  </Card>
                )}

                {report.improvements?.length > 0 && (
                  <Card>
                    <p className="text-sm font-semibold text-amber-600 mb-2 flex items-center gap-1.5"><Lightbulb size={14} /> Areas to Improve</p>
                    <ul className="space-y-1">{report.improvements.map((s, i) => <li key={i} className="text-sm text-[#475569] flex gap-2"><span className="text-amber-500">-</span>{s}</li>)}</ul>
                  </Card>
                )}

                <div className="flex gap-3">
                  <Button className="flex-1" onClick={resetInterview}>New Interview</Button>
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

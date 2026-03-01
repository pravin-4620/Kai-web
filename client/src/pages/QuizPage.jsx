import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Clock, Sparkles, Award, BookOpen, CheckCircle2, Lock, Sun, Sunset, Moon, ArrowLeft, Timer } from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'
import Navbar from '../components/dashboard/Navbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Progress from '../components/ui/Progress'
import { quizApi } from '../lib/api'
import { toast } from 'react-hot-toast'

const SLOT_ICONS = { morning: Sun, afternoon: Sunset, evening: Moon }
const SLOT_COLORS = {
  morning:   'from-amber-50 to-orange-50 border-amber-200',
  afternoon: 'from-sky-50 to-blue-50 border-sky-200',
  evening:   'from-indigo-50 to-purple-50 border-indigo-200',
}

function fmtTimer(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function QuizPage() {
  const [phase, setPhase] = useState('schedule')   // schedule | quiz | result
  const [schedule, setSchedule] = useState([])
  const [quiz, setQuiz] = useState(null)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [selected, setSelected] = useState(null)
  const [showExplain, setShowExplain] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingSlot, setLoadingSlot] = useState(null)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [now, setNow] = useState(new Date())
  const quizStartRef = useRef(null)
  const activeSlotRef = useRef(null)

  // Refresh clock every 30s so slot statuses update
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  const fetchSchedule = useCallback(async () => {
    try {
      const { data } = await quizApi.getSchedule()
      setSchedule(data.schedule || [])
    } catch { setSchedule([]) }
  }, [])

  useEffect(() => {
    fetchSchedule()
    quizApi.getHistory().then(r => setHistory(r.data.history || [])).catch(() => {})
  }, [fetchSchedule])

  // Overall test timer (40 min)
  useEffect(() => {
    if (phase !== 'quiz' || timeLeft <= 0) return
    const t = setInterval(() => {
      setTimeLeft(v => {
        if (v <= 1) { submitQuiz(answers); return 0 }
        return v - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [phase, timeLeft]) // eslint-disable-line

  const startTest = async (slotId) => {
    setLoading(true)
    setLoadingSlot(slotId)
    try {
      const { data } = await quizApi.start(slotId)
      setQuiz(data)
      activeSlotRef.current = slotId
      quizStartRef.current = Date.now()
      setCurrent(0)
      setAnswers({})
      setSelected(null)
      setShowExplain(false)
      setTimeLeft(data.timeLimit || 2400)
      setPhase('quiz')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start test')
    } finally {
      setLoading(false)
      setLoadingSlot(null)
    }
  }

  const handleAnswer = (answer) => {
    if (selected !== null) return
    setSelected(answer)
    setShowExplain(true)
    const q = quiz.questions[current]
    const isCorrect = answer === q.correct
    const updated = { ...answers, [current]: { answer, isCorrect } }
    setAnswers(updated)
    setTimeout(() => {
      setShowExplain(false)
      setSelected(null)
      if (current + 1 >= quiz.questions.length) {
        submitQuiz(updated)
      } else {
        setCurrent(c => c + 1)
      }
    }, 1800)
  }

  const submitQuiz = async (finalAnswers) => {
    try {
      const fa = finalAnswers || answers
      const questionIds = quiz.questions.map(q => q._id)
      const answersArray = quiz.questions.map((_, i) => fa[i]?.answer ?? null)
      const timeTaken = quizStartRef.current ? Math.round((Date.now() - quizStartRef.current) / 1000) : 0
      const { data } = await quizApi.submit({
        questionIds, answers: answersArray,
        slotId: activeSlotRef.current, timeTaken, violations: 0,
      })
      setResult(data)
      setPhase('result')
      fetchSchedule()
    } catch (err) {
      toast.error('Failed to submit test')
      setPhase('schedule')
    }
  }

  const q = quiz?.questions?.[current]
  const totalQ = quiz?.questions?.length ?? 0

  return (
    <div className="page-wrapper">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Daily Tests" />
        <main className="page-main">
          <AnimatePresence mode="wait">

            {/* ─── Schedule View ─────────────────────────────── */}
            {phase === 'schedule' && (
              <motion.div key="schedule" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-2">
                  <Brain size={24} className="text-accent-blue" />
                  <h2 className="text-xl font-bold text-[#0F172A]">Daily Scheduled Tests</h2>
                </div>
                <p className="text-sm text-[#64748B] mb-6">3 tests per day, 40 mixed-topic questions each. Tests open only during their scheduled window.</p>

                <div className="grid gap-4 mb-8">
                  {schedule.map(slot => {
                    const Icon = SLOT_ICONS[slot.id] || Clock
                    const colors = SLOT_COLORS[slot.id] || SLOT_COLORS.morning
                    const canStart = slot.isOpen && !slot.attempted
                    const statusLabel = slot.attempted ? 'Completed' : slot.isOpen ? 'Open Now' : slot.isPast ? 'Closed' : `Opens in ${slot.opensIn} min`
                    const statusCls = slot.attempted ? 'text-green-600 bg-green-50' : slot.isOpen ? 'text-accent-blue bg-blue-50' : 'text-[#64748B] bg-[#F1F5F9]'

                    return (
                      <Card key={slot.id} className={`p-5 bg-gradient-to-r ${colors} relative overflow-hidden`}>
                        {loading && loadingSlot === slot.id && (
                          <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center z-10">
                            <div className="w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/80 border border-white flex items-center justify-center shadow-sm">
                              <Icon size={22} className="text-accent-blue" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-[#0F172A] text-base">{slot.label}</h3>
                              <p className="text-sm text-[#64748B]">{slot.timeRange}</p>
                              <p className="text-xs text-[#94A3B8] mt-0.5">40 questions | 40 min | All topics</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusCls}`}>{statusLabel}</span>
                            {slot.attempted && slot.score !== null && (
                              <span className="text-sm font-bold text-green-600">{slot.score}%</span>
                            )}
                            {canStart && (
                              <Button size="sm" onClick={() => startTest(slot.id)}>Start Test</Button>
                            )}
                            {!slot.isOpen && !slot.attempted && !slot.isPast && (
                              <div className="flex items-center gap-1 text-[#94A3B8]">
                                <Lock size={14} />
                                <span className="text-xs">Locked</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                  {schedule.length === 0 && (
                    <Card className="p-8 text-center">
                      <p className="text-[#64748B]">Loading schedule...</p>
                    </Card>
                  )}
                </div>

                {history.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#64748B] mb-3">Recent Attempts</h3>
                    <div className="space-y-2">
                      {history.slice(0, 5).map(a => (
                        <div key={a._id} className="flex items-center justify-between p-3 rounded-lg bg-[#F1F5F9] border border-[#D9E2EC]">
                          <div>
                            <span className="text-sm text-[#0F172A]">{a.topic || 'Scheduled Test'}</span>
                            {a.slotId && <span className="text-xs text-[#94A3B8] ml-2">({a.slotId})</span>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-[#64748B]">{new Date(a.completedAt).toLocaleDateString()}</span>
                            <span className="text-sm font-semibold text-[#0F172A]">{a.score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── Quiz Phase ───────────────────────────────── */}
            {phase === 'quiz' && q && (
              <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
                {/* Top bar: progress + overall timer */}
                <div className="flex items-center gap-4 mb-6">
                  <Progress value={current + 1} max={totalQ} className="flex-1" color="blue" />
                  <span className="text-sm text-[#64748B] whitespace-nowrap">{current + 1}/{totalQ}</span>
                  <div className={`flex items-center gap-1 text-sm font-mono font-bold ${timeLeft <= 120 ? 'text-red-500' : 'text-accent-blue'}`}>
                    <Timer size={14} />
                    {fmtTimer(timeLeft)}
                  </div>
                </div>

                {q.topic && (
                  <div className="mb-2">
                    <Badge className="text-[10px] bg-[#F1F5F9] text-[#64748B] border border-[#D9E2EC]">{q.topic}</Badge>
                  </div>
                )}

                <Card className="mb-4">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <h3 className="text-base font-semibold text-[#0F172A] leading-relaxed">{q.question}</h3>
                  </div>

                  <div className="space-y-2">
                    {q.options?.map((opt, i) => {
                      let cls = 'border-[#D9E2EC] text-[#475569] hover:border-[#B8C8DB] hover:bg-[#F1F5F9]'
                      if (selected !== null) {
                        if (opt === q.correct) cls = 'border-green-500/50 bg-green-500/10 text-green-600'
                        else if (opt === selected) cls = 'border-red-500/50 bg-red-500/10 text-red-600'
                      }
                      return (
                        <button key={i} onClick={() => handleAnswer(opt)} disabled={selected !== null}
                          className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${cls}`}
                        >
                          <span className="font-medium text-[#64748B] mr-3">{String.fromCharCode(65 + i)}.</span>
                          {opt}
                        </button>
                      )
                    })}
                  </div>

                  {showExplain && q.explanation && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 rounded-lg bg-accent-blue/10 border border-accent-blue/20">
                      <p className="text-xs text-accent-blue font-semibold mb-1">Explanation</p>
                      <p className="text-sm text-[#475569]">{q.explanation}</p>
                    </motion.div>
                  )}
                </Card>

                <div className="flex justify-end">
                  <Button variant="secondary" size="sm" onClick={() => { handleAnswer(null) }} disabled={selected !== null}>
                    Skip
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ─── Result Phase ─────────────────────────────── */}
            {phase === 'result' && result && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-xl mx-auto text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] border border-[#D9E2EC] flex items-center justify-center mx-auto mb-4">
                  {result.score >= 80 ? <Award size={28} className="text-[#FBBF24]" /> : result.score >= 60 ? <CheckCircle2 size={28} className="text-[#4F8EF7]" /> : <BookOpen size={28} className="text-[#64748B]" />}
                </div>
                <h2 className="text-2xl font-bold text-[#0F172A] mb-1">Test Complete</h2>
                <p className="text-[#64748B] mb-6">{quiz?.slotLabel || 'Scheduled Test'}</p>

                <Card className="mb-6">
                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div>
                      <p className="text-3xl font-bold text-accent-blue">{result.score ?? 0}%</p>
                      <p className="text-xs text-[#64748B] mt-1">Score</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-green-500">{result.correct ?? 0}</p>
                      <p className="text-xs text-[#64748B] mt-1">Correct</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-red-500">{result.incorrect ?? 0}</p>
                      <p className="text-xs text-[#64748B] mt-1">Wrong</p>
                    </div>
                  </div>

                  {/* Per-topic breakdown */}
                  {result.topicBreakdown && Object.keys(result.topicBreakdown).length > 0 && (
                    <div className="border-t border-[#D9E2EC] pt-4">
                      <p className="text-xs font-semibold text-[#64748B] mb-3 text-left">Topic Breakdown</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(result.topicBreakdown).map(([topic, { correct: c, total: t }]) => (
                          <div key={topic} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#F1F5F9] text-left">
                            <span className="text-xs text-[#475569] truncate">{topic}</span>
                            <span className={`text-xs font-bold ${t > 0 && c / t >= 0.5 ? 'text-green-600' : 'text-red-500'}`}>{c}/{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.attempt?.aiInsight && (
                    <div className="mt-4 p-3 rounded-lg bg-[#F1F5F9] border border-[#D9E2EC] text-left">
                      <p className="text-xs text-[#64748B] mb-1 flex items-center gap-1"><Sparkles size={10} />AI Insight</p>
                      <p className="text-sm text-[#475569]">{result.attempt.aiInsight}</p>
                    </div>
                  )}
                </Card>

                <Button variant="secondary" className="w-full" onClick={() => { setPhase('schedule'); fetchSchedule() }} leftIcon={<ArrowLeft size={16} />}>
                  Back to Schedule
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

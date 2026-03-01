import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smile, Lock, CheckCircle, ChevronRight, Mic, Send, Star, Sparkles, Award, BookOpen, BarChart3 } from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'
import Navbar from '../components/dashboard/Navbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Progress from '../components/ui/Progress'
import { softSkillsApi } from '../lib/api'
import { toast } from 'react-hot-toast'

export default function SoftSkillsPage() {
  const [modules, setModules] = useState([])
  const [progress, setProgress] = useState({})
  const [active, setActive] = useState(null)
  const [phase, setPhase] = useState('intro') // intro | practice | feedback
  const [userResponse, setUserResponse] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      softSkillsApi.getModules().then(r => setModules(r.data.modules || [])),
      softSkillsApi.getProgress().then(r => setProgress(r.data.progress || {})),
    ]).catch(() => toast.error('Failed to load modules')).finally(() => setLoading(false))
  }, [])

  const openModule = (mod) => {
    setActive(mod)
    setPhase('intro')
    setUserResponse('')
    setFeedback(null)
  }

  const submitResponse = async () => {
    if (!userResponse.trim()) return toast.error('Please enter a response')
    setSubmitting(true)
    try {
      const { data } = await softSkillsApi.submitExercise({ moduleId: active.id, response: userResponse, scenario: active.scenarios?.[0] })
      setFeedback(data.feedback || data)
      setPhase('feedback')
      setProgress(p => ({ ...p, [active.id]: { score: data.newProgress, completed: true } }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Soft Skills Lab" />
        <main className="page-main">
          {!active ? (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <Smile size={24} className="text-accent-blue" />
                <div>
                  <h2 className="text-xl font-bold text-[#0F172A]">Soft Skills Lab</h2>
                  <p className="text-sm text-[#64748B]">Practice communication, leadership, and professional skills</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 card animate-pulse" />)
                ) : modules.map((mod, i) => {
                  const prog = progress[mod.id]
                  const locked = mod.locked
                  return (
                    <motion.div key={mod.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                      <Card
                        hover={!locked}
                        onClick={() => !locked && openModule(mod)}
                        className={locked ? 'opacity-60 cursor-not-allowed' : ''}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-9 h-9 rounded-lg bg-[#F1F5F9] border border-[#D9E2EC] flex items-center justify-center">
                            <BarChart3 size={16} className="text-[#4F8EF7]" />
                          </div>
                          {locked ? <Lock size={14} className="text-[#64748B]" /> : prog?.completed ? <CheckCircle size={14} className="text-green-400" /> : <ChevronRight size={14} className="text-[#64748B]" />}
                        </div>
                        <h3 className="font-semibold text-[#0F172A] mb-1">{mod.title}</h3>
                        <p className="text-xs text-[#64748B] mb-3">{mod.description}</p>
                        {prog?.score != null && (
                          <div className="mt-auto">
                            <Progress value={prog.score} showLabel size="sm" color="blue" />
                          </div>
                        )}
                        {locked && <p className="text-xs text-[#64748B] mt-2">Complete previous modules to unlock</p>}
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <button onClick={() => setActive(null)} className="text-sm text-[#64748B] hover:text-[#0F172A] mb-4 flex items-center gap-1">← Back to Modules</button>

              <AnimatePresence mode="wait">
                {phase === 'intro' && (
                  <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <Card className="text-center mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] border border-[#D9E2EC] flex items-center justify-center mx-auto"><Smile size={20} className="text-[#4F8EF7]" /></div>
                      <h2 className="text-xl font-bold text-[#0F172A] mt-3 mb-2">{active.title}</h2>
                      <p className="text-[#64748B] text-sm mb-6">{active.description}</p>
                      {active.tips?.length > 0 && (
                        <div className="text-left mb-6">
                          <p className="text-sm font-semibold text-[#475569] mb-2">Key Tips:</p>
                          <ul className="space-y-1">{active.tips.map((t, i) => <li key={i} className="text-sm text-[#64748B] flex gap-2"><Star size={10} className="text-accent-blue mt-1 flex-shrink-0" />{t}</li>)}</ul>
                        </div>
                      )}
                      <Button className="w-full" onClick={() => setPhase('practice')}>Start Practice</Button>
                    </Card>
                  </motion.div>
                )}

                {phase === 'practice' && (
                  <motion.div key="practice" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <Card>
                      <h3 className="font-semibold text-[#0F172A] mb-3">Scenario</h3>
                      <div className="p-4 rounded-lg bg-accent-blue/5 border border-accent-blue/20 mb-4">
                        <p className="text-sm text-[#475569]">{active.scenarios?.[0] || `Practice your ${active.title} skills in a professional context.`}</p>
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-[#475569]">Your Response</label>
                        <textarea
                          value={userResponse}
                          onChange={e => setUserResponse(e.target.value)}
                          rows={6}
                          className="input-field w-full resize-none"
                          placeholder="Type your response here..."
                        />
                        <div className="flex gap-2">
                          <Button className="flex-1" onClick={submitResponse} loading={submitting} leftIcon={<Send size={14} />}>Submit for AI Feedback</Button>
                          <Button variant="ghost" size="icon" title="Voice input"><Mic size={16} /></Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {phase === 'feedback' && feedback && (
                  <motion.div key="feedback" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    <Card className="text-center mb-4">
                      <div className="w-14 h-14 rounded-xl bg-[#F1F5F9] border border-[#D9E2EC] flex items-center justify-center mx-auto mb-3">
                        {feedback.score >= 80 ? <Award size={24} className="text-[#FBBF24]" /> : feedback.score >= 60 ? <CheckCircle size={24} className="text-[#4F8EF7]" /> : <BookOpen size={24} className="text-[#64748B]" />}
                      </div>
                      <p className="text-3xl font-bold text-[#0F172A]">{feedback.score}%</p>
                      <p className="text-[#64748B] text-sm">Performance Score</p>
                      <Progress value={feedback.score} className="mt-3 max-w-xs mx-auto" />
                    </Card>
                    <Card className="mb-4">
                      <p className="text-sm font-semibold text-[#475569] mb-3 flex items-center gap-2"><Sparkles size={14} className="text-accent-purple" />AI Feedback</p>
                      <p className="text-sm text-[#475569] leading-relaxed">{feedback.aiFeedback}</p>
                    </Card>
                    {feedback.suggestions?.length > 0 && (
                      <Card className="mb-4">
                        <p className="text-sm font-semibold text-[#475569] mb-2">Suggestions</p>
                        <ul className="space-y-1">{feedback.suggestions.map((s, i) => <li key={i} className="text-sm text-[#64748B] flex gap-2"><span className="text-accent-blue">→</span>{s}</li>)}</ul>
                      </Card>
                    )}
                    <div className="flex gap-3">
                      <Button className="flex-1" onClick={() => { setPhase('practice'); setUserResponse(''); setFeedback(null) }}>Try Again</Button>
                      <Button variant="secondary" className="flex-1" onClick={() => setActive(null)}>Back to Modules</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

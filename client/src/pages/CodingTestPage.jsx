import { useState, useEffect, useContext, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Send, Clock, Shield, AlertTriangle, CheckCircle, ChevronDown, Award, BookOpen, Sparkles } from 'lucide-react'
import Editor from '@monaco-editor/react'
import Sidebar from '../components/dashboard/Sidebar'
import Navbar from '../components/dashboard/Navbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { codingApi } from '../lib/api'
import FocusContext from '../context/FocusContext'
import { toast } from 'react-hot-toast'
import { CODING_LANGUAGES, difficultyClass } from '../lib/utils'

const LANG_MAP = { 'Python': 'python', 'JavaScript': 'javascript', 'Java': 'java', 'C++': 'cpp', 'C': 'c', 'Go': 'go', 'Rust': 'rust' }
const LANG_LIST = Object.keys(LANG_MAP)
const DEFAULT_CODE = { python: '# Write your solution here\n\ndef solution():\n    pass\n', javascript: '// Write your solution here\n\nfunction solution() {\n    \n}\n', java: '// Write your solution here\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}\n', cpp: '// Write your solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n', c: '#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}\n', go: 'package main\n\nfunc main() {\n    \n}\n', rust: 'fn main() {\n    \n}\n' }

export default function CodingTestPage() {
  const [problems, setProblems] = useState([])
  const [selected, setSelected] = useState(null)
  const [lang, setLang] = useState('Python')
  const [code, setCode] = useState(DEFAULT_CODE['python'])
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [runResult, setRunResult] = useState(null)
  const [submitResult, setSubmitResult] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [timer, setTimer] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const timerRef = useRef(null)
  const { startFocus, stopFocus, logViolation, isActive } = useContext(FocusContext)

  useEffect(() => {
    codingApi.getProblems().then(r => setProblems(r.data.problems)).catch(() => toast.error('Failed to load problems'))
  }, [])

  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [timerActive])

  const selectProblem = (p) => {
    setSelected(p)
    setCode(DEFAULT_CODE[LANG_MAP[lang]] || '')
    setRunResult(null)
    setSubmitResult(null)
    setTimer(0)
    setTimerActive(true)
    startFocus()
  }

  const changeLang = (l) => {
    setLang(l)
    setCode(DEFAULT_CODE[LANG_MAP[l]] || '')
  }

  const handleRun = async () => {
    if (!code.trim()) return
    setRunning(true)
    try {
      const { data } = await codingApi.runCode({ code, language: lang, problemId: selected._id })
      setRunResult(data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Run failed')
    } finally {
      setRunning(false)
    }
  }

  const handleSubmit = async () => {
    if (!code.trim()) return
    setSubmitting(true)
    try {
      const { data } = await codingApi.submitCode({ code, language: lang, problemId: selected._id, timeTaken: timer })
      setSubmitResult(data)
      setShowResult(true)
      setTimerActive(false)
      stopFocus()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  if (!selected) {
    return (
      <div className="page-wrapper">
        <Sidebar />
        <div className="page-content">
          <Navbar title="Coding Tests" />
          <main className="page-main">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-bold text-[#0F172A] mb-6">Choose a Problem</h2>
              <div className="space-y-3">
                {problems.map((p, i) => (
                  <motion.div key={p._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <Card hover onClick={() => selectProblem(p)} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] border border-[#D9E2EC] flex items-center justify-center text-sm font-mono font-bold text-[#64748B]">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#0F172A]">{p.title}</p>
                        <p className="text-xs text-[#64748B] mt-0.5">{p.tags?.join(', ')}</p>
                      </div>
                      <Badge className={difficultyClass(p.difficulty)}>{p.difficulty}</Badge>
                      <span className="text-xs text-[#64748B]">{p.timeLimit ?? 30} min</span>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Test header */}
        <div className="h-12 bg-bg-secondary border-b border-[#D9E2EC] flex items-center px-4 gap-4">
          <button onClick={() => { setSelected(null); stopFocus(); setTimerActive(false) }} className="text-[#64748B] hover:text-[#0F172A] text-sm">← Back</button>
          <span className="font-semibold text-[#0F172A] text-sm flex-1 truncate">{selected.title}</span>
          <Badge className={difficultyClass(selected.difficulty)}>{selected.difficulty}</Badge>
          {isActive && <Badge variant="green"><Shield size={10} className="mr-1" />Focus Mode</Badge>}
          <div className="flex items-center gap-1 text-sm font-mono text-accent-blue">
            <Clock size={14} />
            {formatTime(timer)}
          </div>
          <Button size="sm" variant="ghost" onClick={handleRun} loading={running} leftIcon={<Play size={14} />}>Run</Button>
          <Button size="sm" onClick={handleSubmit} loading={submitting} leftIcon={<Send size={14} />}>Submit</Button>
        </div>

        {/* Split pane */}
        <div className="flex-1 flex overflow-hidden">
          {/* Problem description */}
          <div className="w-80 lg:w-96 flex-shrink-0 overflow-y-auto p-4 border-r border-[#D9E2EC] space-y-4">
            <h3 className="font-bold text-[#0F172A]">{selected.title}</h3>
            <p className="text-sm text-[#475569] leading-relaxed whitespace-pre-wrap">{selected.description}</p>
            {selected.examples?.map((ex, i) => (
              <div key={i} className="bg-[#F1F5F9] border border-[#D9E2EC] rounded-lg p-3 text-xs font-mono">
                <p className="text-[#64748B] mb-1">Example {i + 1}:</p>
                <p className="text-green-300">Input: {ex.input}</p>
                <p className="text-blue-300">Output: {ex.output}</p>
                {ex.explanation && <p className="text-[#64748B] mt-1">// {ex.explanation}</p>}
              </div>
            ))}
            {selected.constraints && (
              <div>
                <p className="text-xs font-semibold text-[#64748B] mb-2">Constraints:</p>
                <ul className="text-xs text-[#64748B] space-y-1 list-disc list-inside font-mono">
                  {selected.constraints.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}

            {/* Run result */}
            {runResult && (
              <div className={`rounded-lg p-3 text-xs ${runResult.allPassed ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                <p className={`font-semibold mb-1 ${runResult.allPassed ? 'text-green-400' : 'text-red-400'}`}>
                  {runResult.allPassed ? 'All tests passed' : `${runResult.passedCount}/${runResult.totalCount} passed`}
                </p>
                {runResult.results?.slice(0, 3).map((r, i) => (
                  <div key={i} className="mt-1">
                    <span className={r.passed ? 'text-green-400' : 'text-red-400'}>{r.passed ? '✓' : '✗'} TC {i + 1}</span>
                    {!r.passed && r.stderr && <p className="text-red-300 mt-0.5 truncate">{r.stderr}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Lang selector */}
            <div className="flex items-center gap-2 px-3 py-2 bg-bg-secondary border-b border-[#D9E2EC]">
              {LANG_LIST.map(l => (
                <button key={l} onClick={() => changeLang(l)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${lang === l ? 'bg-accent-blue/20 text-accent-blue' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                >{l}</button>
              ))}
            </div>
            <div className="flex-1">
              <Editor
                height="100%"
                language={LANG_MAP[lang]}
                value={code}
                onChange={v => setCode(v || '')}
                theme="light"
                options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, fontFamily: '"JetBrains Mono", monospace', contextmenu: false }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit result modal */}
      <Modal isOpen={showResult} onClose={() => setShowResult(false)} title="Submission Result" size="lg">
        {submitResult && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl bg-[#F1F5F9] border border-[#D9E2EC] flex items-center justify-center mx-auto mb-3">
                {submitResult.attempt?.aiEvaluation?.overallGrade === 'A'
                  ? <Award size={24} className="text-[#FBBF24]" />
                  : submitResult.attempt?.aiEvaluation?.overallGrade === 'B'
                    ? <Sparkles size={24} className="text-[#4F8EF7]" />
                    : <BookOpen size={24} className="text-[#64748B]" />}
              </div>
              <p className="text-2xl font-bold text-[#0F172A]">Grade: {submitResult.attempt?.aiEvaluation?.overallGrade || '?'}</p>
              <div className="flex items-center justify-center gap-6 mt-3">
                <span className="text-sm text-[#64748B]">Correctness: <span className="text-[#0F172A] font-semibold">{submitResult.attempt?.aiEvaluation?.correctnessScore ?? 0}%</span></span>
                <span className="text-sm text-[#64748B]">Code Quality: <span className="text-[#0F172A] font-semibold">{submitResult.attempt?.aiEvaluation?.codeQualityScore ?? 0}%</span></span>
              </div>
            </div>
            {submitResult.attempt?.aiEvaluation?.suggestions?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-[#475569] mb-2">AI Suggestions:</p>
                <ul className="space-y-1">
                  {submitResult.attempt.aiEvaluation.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-[#64748B] flex gap-2"><span className="text-accent-blue">•</span>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {submitResult.newBadges?.length > 0 && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm font-semibold text-yellow-400">New Badges Unlocked</p>
                <div className="flex gap-2 mt-1">{submitResult.newBadges.map(b => <span key={b.key} className="text-xl">{b.emoji}</span>)}</div>
              </div>
            )}
            <Button className="w-full" onClick={() => setShowResult(false)}>Continue</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}

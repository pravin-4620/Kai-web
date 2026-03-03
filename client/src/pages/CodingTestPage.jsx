import { useState, useEffect, useContext, useRef, useCallback, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Send, Clock, CheckCircle, XCircle, Code2, ChevronRight, Trophy, Lightbulb, ArrowLeft, RotateCcw } from 'lucide-react'
import Editor from '@monaco-editor/react'
import Sidebar from '../components/dashboard/Sidebar'
import Navbar from '../components/dashboard/Navbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { codingApi } from '../lib/api'
import { toast } from 'react-hot-toast'

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const LANGUAGES = [
  { label: 'Python',     value: 'python' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Java',       value: 'java' },
  { label: 'C++',        value: 'cpp' },
  { label: 'Go',         value: 'go' },
  { label: 'Rust',       value: 'rust' },
]

const DIFF_STYLE = {
  easy:   'bg-[#171717] text-[#e5e5e5] border-[#404040]',
  medium: 'bg-[#262626] text-[#d4d4d4] border-[#404040]',
  hard:   'bg-[#262626] text-[#a3a3a3] border-[#404040]',
}

const EDITOR_OPTIONS = Object.freeze({
  fontSize: 14,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontLigatures: true,
  contextmenu: false,
  lineNumbers: 'on',
  renderLineHighlight: 'line',
  bracketPairColorization: { enabled: true },
  autoClosingBrackets: 'always',
  tabSize: 4,
  wordWrap: 'on',
  padding: { top: 12, bottom: 12 },
  smoothScrolling: true,
  cursorBlinking: 'smooth',
  suggest: { showMethods: true, showFunctions: true },
})

const formatTime = (s) => {
  const h = Math.floor(s / 3600)
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`
}

const FALLBACK_STARTER = {
  python:     '# Write your solution here\n\n',
  javascript: '// Write your solution here\n\n',
  java:       'class Solution {\n    // Write your solution here\n}\n',
  cpp:        '#include <iostream>\nusing namespace std;\n\n// Write your solution here\nint main() {\n    return 0;\n}\n',
  go:         'package main\n\n// Write your solution here\nfunc main() {\n}\n',
  rust:       '// Write your solution here\nfn main() {\n}\n',
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function CodingTestPage() {
  const [phase, setPhase]           = useState('lobby')   // lobby | test | results
  const [problems, setProblems]     = useState([])
  const [activeIdx, setActiveIdx]   = useState(0)
  const [lang, setLang]             = useState('python')
  const [codes, setCodes]           = useState({})        // { problemId: { python: '...' } }
  const [runResults, setRunResults] = useState({})        // { problemId: result }
  const [submissions, setSubmissions] = useState({})      // { problemId: result }
  const [timer, setTimer]           = useState(0)
  const [loading, setLoading]       = useState(false)
  const [running, setRunning]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showHints, setShowHints]   = useState({})
  const [showResults, setShowResults] = useState(false)
  const timerRef = useRef(null)

  const activeProblem = problems[activeIdx] || null

  // Current code for active problem + language
  const currentCode = useMemo(() => {
    if (!activeProblem) return ''
    return codes[activeProblem.id]?.[lang] ?? ''
  }, [codes, activeProblem?.id, lang])

  /* ─── Timer ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (phase === 'test') {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => { clearInterval(timerRef.current); timerRef.current = null }
  }, [phase])

  /* ─── Start Session ─────────────────────────────────────────────────────── */
  const startSession = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await codingApi.getSession()
      const probs = data.problems
      setProblems(probs)

      // Initialize codes with starter code for all languages
      const initial = {}
      for (const p of probs) {
        initial[p.id] = {}
        for (const l of LANGUAGES) {
          initial[p.id][l.value] = p.starterCode?.[l.value] || FALLBACK_STARTER[l.value] || ''
        }
      }
      setCodes(initial)
      setRunResults({})
      setSubmissions({})
      setActiveIdx(0)
      setTimer(0)
      setPhase('test')
    } catch (err) {
      toast.error('Failed to start session')
    } finally {
      setLoading(false)
    }
  }, [])

  /* ─── Code Change ───────────────────────────────────────────────────────── */
  const handleCodeChange = useCallback((value) => {
    if (!activeProblem) return
    setCodes(prev => ({
      ...prev,
      [activeProblem.id]: { ...prev[activeProblem.id], [lang]: value ?? '' }
    }))
  }, [activeProblem?.id, lang])

  /* ─── Run Code ──────────────────────────────────────────────────────────── */
  const handleRun = useCallback(async () => {
    if (!activeProblem || !currentCode.trim()) return
    setRunning(true)
    try {
      const { data } = await codingApi.runCode({
        code: currentCode,
        language: lang,
        problemId: activeProblem.id,
      })
      setRunResults(prev => ({ ...prev, [activeProblem.id]: data }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Run failed')
    } finally {
      setRunning(false)
    }
  }, [activeProblem?.id, currentCode, lang])

  /* ─── Submit Code ───────────────────────────────────────────────────────── */
  const handleSubmit = useCallback(async () => {
    if (!activeProblem || !currentCode.trim()) return
    setSubmitting(true)
    try {
      const { data } = await codingApi.submitCode({
        code: currentCode,
        language: lang,
        problemId: activeProblem.id,
        timeTaken: timer,
      })
      setSubmissions(prev => ({ ...prev, [activeProblem.id]: data }))
      toast.success(`Problem ${activeIdx + 1} submitted`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }, [activeProblem?.id, currentCode, lang, timer, activeIdx])

  /* ─── Language Change ───────────────────────────────────────────────────── */
  const handleLangChange = useCallback((newLang) => {
    setLang(newLang)
  }, [])

  /* ─── Reset Code ────────────────────────────────────────────────────────── */
  const handleReset = useCallback(() => {
    if (!activeProblem) return
    const starter = activeProblem.starterCode?.[lang] || FALLBACK_STARTER[lang] || ''
    setCodes(prev => ({
      ...prev,
      [activeProblem.id]: { ...prev[activeProblem.id], [lang]: starter }
    }))
    setRunResults(prev => { const n = { ...prev }; delete n[activeProblem.id]; return n })
  }, [activeProblem, lang])

  /* ─── Finish Session ────────────────────────────────────────────────────── */
  const handleFinish = useCallback(() => {
    clearInterval(timerRef.current)
    setShowResults(true)
  }, [])

  const submittedCount = Object.keys(submissions).length
  const allSubmitted = submittedCount === problems.length

  /* ═══════════════════════════════════════════════════════════════════════════
     LOBBY PHASE
     ═══════════════════════════════════════════════════════════════════════════ */
  if (phase === 'lobby') {
    return (
      <div className="page-wrapper">
        <Sidebar />
        <div className="page-content">
          <Navbar title="Coding Test" />
          <main className="page-main">
            <div className="max-w-2xl mx-auto py-8">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-bg-tertiary border border-kai-border flex items-center justify-center mx-auto mb-5">
                    <Code2 size={24} className="text-text-muted" />
                  </div>
                  <h1 className="text-2xl font-bold text-text-primary mb-2">Coding Test</h1>
                  <p className="text-text-muted text-sm mb-6 max-w-md mx-auto leading-relaxed">
                    You will receive 3 LeetCode-style problems — 1 easy, 1 medium, 1 hard.
                    Solve them using your preferred programming language. AI will evaluate your code.
                  </p>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { label: 'Problems', value: '3' },
                      { label: 'Languages', value: '6' },
                      { label: 'AI Review', value: 'Yes' },
                    ].map(s => (
                      <div key={s.label} className="bg-bg-tertiary border border-kai-border rounded-lg p-3">
                        <p className="text-lg font-bold text-text-primary tabular-nums">{s.value}</p>
                        <p className="text-xs text-text-muted">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="text-left bg-bg-tertiary border border-kai-border rounded-lg p-4 mb-6">
                    <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">How it works</p>
                    <ul className="space-y-2 text-sm text-text-secondary">
                      <li className="flex items-start gap-2"><span className="text-text-muted font-mono text-xs mt-0.5">1.</span> You get 3 problems with sample test cases</li>
                      <li className="flex items-start gap-2"><span className="text-text-muted font-mono text-xs mt-0.5">2.</span> Write your solution and run against sample tests</li>
                      <li className="flex items-start gap-2"><span className="text-text-muted font-mono text-xs mt-0.5">3.</span> Submit each problem for full evaluation</li>
                      <li className="flex items-start gap-2"><span className="text-text-muted font-mono text-xs mt-0.5">4.</span> AI grades correctness, quality, and complexity</li>
                    </ul>
                  </div>

                  <Button size="lg" onClick={startSession} loading={loading} rightIcon={<ChevronRight size={16} />}>
                    Start Coding Test
                  </Button>
                </Card>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     TEST PHASE
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="h-screen flex flex-col bg-bg-primary overflow-hidden">
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="h-11 bg-bg-secondary border-b border-kai-border flex items-center px-3 gap-2 flex-shrink-0">
        <button
          onClick={() => { clearInterval(timerRef.current); setPhase('lobby') }}
          className="text-text-muted hover:text-text-primary text-xs flex items-center gap-1 mr-2"
        >
          <ArrowLeft size={14} /> Exit
        </button>

        <div className="h-5 w-px bg-kai-border" />

        {/* Problem tabs */}
        {problems.map((p, i) => {
          const submitted = !!submissions[p.id]
          const isActive = i === activeIdx
          return (
            <button
              key={p.id}
              onClick={() => setActiveIdx(i)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-bg-tertiary text-text-primary border border-kai-border'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {submitted ? (
                <CheckCircle size={12} className="text-text-secondary" />
              ) : (
                <span className="w-3 h-3 rounded-full border border-current text-[8px] flex items-center justify-center font-mono">
                  {i + 1}
                </span>
              )}
              <span className="hidden sm:inline">{p.title}</span>
              <span className="sm:hidden">P{i + 1}</span>
            </button>
          )
        })}

        <div className="flex-1" />

        {/* Timer */}
        <div className="flex items-center gap-1 text-xs font-mono text-text-muted">
          <Clock size={12} />
          {formatTime(timer)}
        </div>

        <div className="h-5 w-px bg-kai-border" />

        {/* Submitted count */}
        <span className="text-xs text-text-muted">
          {submittedCount}/{problems.length} done
        </span>

        <Button
          size="sm"
          variant={allSubmitted ? 'default' : 'ghost'}
          onClick={handleFinish}
          disabled={submittedCount === 0}
        >
          Finish
        </Button>
      </div>

      {/* ── Split Pane ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Problem description */}
        {activeProblem && (
          <div className="w-[340px] lg:w-[420px] flex-shrink-0 overflow-y-auto border-r border-kai-border bg-bg-primary">
            <div className="p-4 space-y-4">
              {/* Title + difficulty */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-bold text-text-primary">{activeProblem.title}</h2>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${DIFF_STYLE[activeProblem.difficulty]}`}>
                    {activeProblem.difficulty}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {activeProblem.tags?.map(t => (
                    <span key={t} className="text-[10px] text-text-muted bg-bg-tertiary border border-kai-border rounded px-1.5 py-0.5">{t}</span>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {activeProblem.description}
              </div>

              {/* Examples */}
              <div className="space-y-2">
                {activeProblem.examples?.map((ex, i) => (
                  <ExampleBlock key={i} example={ex} index={i} />
                ))}
              </div>

              {/* Constraints */}
              {activeProblem.constraints?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text-muted mb-1.5">Constraints:</p>
                  <ul className="text-xs text-text-muted space-y-1 font-mono">
                    {activeProblem.constraints.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-text-muted mt-0.5">-</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hints */}
              {activeProblem.hints?.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowHints(prev => ({ ...prev, [activeProblem.id]: !prev[activeProblem.id] }))}
                    className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
                  >
                    <Lightbulb size={12} />
                    {showHints[activeProblem.id] ? 'Hide Hints' : 'Show Hints'}
                  </button>
                  <AnimatePresence>
                    {showHints[activeProblem.id] && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 space-y-1 overflow-hidden"
                      >
                        {activeProblem.hints.map((h, i) => (
                          <li key={i} className="text-xs text-text-muted bg-bg-tertiary border border-kai-border rounded p-2">
                            {h}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Run Results */}
              {runResults[activeProblem.id] && (
                <RunResultPanel result={runResults[activeProblem.id]} />
              )}

              {/* Submission Result */}
              {submissions[activeProblem.id] && (
                <SubmissionPanel result={submissions[activeProblem.id]} />
              )}
            </div>
          </div>
        )}

        {/* RIGHT: Code editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Language bar + actions */}
          <div className="flex items-center gap-1 px-3 py-1.5 bg-bg-secondary border-b border-kai-border">
            {LANGUAGES.map(l => (
              <LangButton key={l.value} lang={l} isActive={lang === l.value} onChange={handleLangChange} />
            ))}

            <div className="flex-1" />

            <button
              onClick={handleReset}
              className="p-1.5 rounded text-text-muted hover:text-text-secondary hover:bg-bg-tertiary transition-colors"
              title="Reset code"
            >
              <RotateCcw size={13} />
            </button>

            <Button size="sm" variant="ghost" onClick={handleRun} loading={running} leftIcon={<Play size={13} />}>
              Run
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              loading={submitting}
              leftIcon={<Send size={13} />}
              disabled={!!submissions[activeProblem?.id]}
            >
              {submissions[activeProblem?.id] ? 'Submitted' : 'Submit'}
            </Button>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={lang === 'cpp' ? 'cpp' : lang}
              value={currentCode}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={EDITOR_OPTIONS}
              loading={
                <div className="flex items-center justify-center h-full bg-bg-primary">
                  <p className="text-text-muted text-sm">Loading editor...</p>
                </div>
              }
            />
          </div>
        </div>
      </div>

      {/* ── Results Modal ───────────────────────────────────────────────────── */}
      <Modal isOpen={showResults} onClose={() => setShowResults(false)} title="Test Results" size="lg">
        <ResultsSummary
          problems={problems}
          submissions={submissions}
          timer={timer}
          onClose={() => { setShowResults(false); setPhase('lobby') }}
        />
      </Modal>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */

const ExampleBlock = memo(function ExampleBlock({ example, index }) {
  return (
    <div className="bg-bg-tertiary border border-kai-border rounded-lg p-3 text-xs font-mono">
      <p className="text-text-muted mb-1.5 font-sans font-semibold">Example {index + 1}:</p>
      <div className="space-y-0.5">
        <p><span className="text-text-muted">Input: </span><span className="text-text-secondary">{example.input}</span></p>
        <p><span className="text-text-muted">Output: </span><span className="text-text-primary">{example.output}</span></p>
        {example.explanation && (
          <p className="text-text-muted mt-1 font-sans text-[11px]">{example.explanation}</p>
        )}
      </div>
    </div>
  )
})

const LangButton = memo(function LangButton({ lang, isActive, onChange }) {
  return (
    <button
      onClick={() => onChange(lang.value)}
      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
        isActive
          ? 'bg-bg-tertiary text-text-primary border border-kai-border'
          : 'text-text-muted hover:text-text-secondary'
      }`}
    >
      {lang.label}
    </button>
  )
})

const RunResultPanel = memo(function RunResultPanel({ result }) {
  const allPassed = result.allPassed
  return (
    <div className={`rounded-lg p-3 text-xs border ${
      allPassed ? 'bg-bg-tertiary border-[#404040]' : 'bg-bg-tertiary border-[#404040]'
    }`}>
      <p className={`font-semibold mb-2 ${allPassed ? 'text-text-primary' : 'text-text-secondary'}`}>
        {allPassed
          ? 'All sample tests passed'
          : `${result.passedCount}/${result.totalCount} sample tests passed`}
      </p>
      {result.results?.map((r, i) => (
        <div key={i} className="flex items-start gap-2 mt-1.5">
          {r.passed ? (
            <CheckCircle size={12} className="text-text-secondary mt-0.5" />
          ) : (
            <XCircle size={12} className="text-text-muted mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-text-secondary">Test {i + 1}</span>
            {!r.passed && r.output && (
              <p className="text-text-muted mt-0.5 truncate">Got: {r.output}</p>
            )}
            {!r.passed && r.error && (
              <p className="text-text-muted mt-0.5 truncate">{r.error}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
})

const SubmissionPanel = memo(function SubmissionPanel({ result }) {
  const ai = result.aiEvaluation || {}
  return (
    <div className="rounded-lg border border-kai-border bg-bg-secondary p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-text-primary">Submission Result</p>
        <span className="text-sm font-bold text-text-primary font-mono">{result.grade || ai.overallGrade || '?'}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-bg-tertiary rounded p-2">
          <p className="text-text-muted">Correctness</p>
          <p className="text-text-primary font-semibold">{ai.correctnessScore ?? 0}%</p>
        </div>
        <div className="bg-bg-tertiary rounded p-2">
          <p className="text-text-muted">Code Quality</p>
          <p className="text-text-primary font-semibold">{ai.codeQualityScore ?? 0}%</p>
        </div>
        <div className="bg-bg-tertiary rounded p-2">
          <p className="text-text-muted">Time</p>
          <p className="text-text-primary font-mono text-[11px]">{ai.timeComplexity || 'N/A'}</p>
        </div>
        <div className="bg-bg-tertiary rounded p-2">
          <p className="text-text-muted">Space</p>
          <p className="text-text-primary font-mono text-[11px]">{ai.spaceComplexity || 'N/A'}</p>
        </div>
      </div>
      {ai.suggestions?.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-text-muted mb-1">Suggestions:</p>
          <ul className="space-y-0.5">
            {ai.suggestions.map((s, i) => (
              <li key={i} className="text-[11px] text-text-muted flex gap-1.5">
                <span className="text-text-secondary">-</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="text-xs text-text-muted">
        Tests passed: {result.passedCount}/{result.totalCount} ({Math.round(result.passRate)}%)
      </div>
    </div>
  )
})

const ResultsSummary = memo(function ResultsSummary({ problems, submissions, timer, onClose }) {
  const totalScore = useMemo(() => {
    if (Object.keys(submissions).length === 0) return 0
    const scores = Object.values(submissions).map(s => s.aiEvaluation?.correctnessScore || 0)
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }, [submissions])

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-bg-tertiary border border-kai-border flex items-center justify-center mx-auto mb-3">
          <Trophy size={24} className="text-text-muted" />
        </div>
        <p className="text-3xl font-bold text-text-primary tabular-nums">{totalScore}%</p>
        <p className="text-sm text-text-muted">Average Score - {formatTime(timer)}</p>
      </div>

      <div className="space-y-2">
        {problems.map((p, i) => {
          const sub = submissions[p.id]
          const ai = sub?.aiEvaluation
          return (
            <div key={p.id} className="flex items-center gap-3 bg-bg-tertiary border border-kai-border rounded-lg p-3">
              <span className="w-6 h-6 rounded-md bg-bg-secondary border border-kai-border flex items-center justify-center text-xs font-mono text-text-muted">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{p.title}</p>
                <p className="text-xs text-text-muted">{p.difficulty}</p>
              </div>
              {sub ? (
                <div className="text-right">
                  <p className="text-sm font-bold text-text-primary">{sub.grade || ai?.overallGrade || '?'}</p>
                  <p className="text-[10px] text-text-muted">{ai?.correctnessScore ?? 0}%</p>
                </div>
              ) : (
                <span className="text-xs text-text-muted">Not submitted</span>
              )}
            </div>
          )
        })}
      </div>

      <Button className="w-full" onClick={onClose}>Done</Button>
    </div>
  )
})
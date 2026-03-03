import { useState, useRef, useCallback, memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, Sparkles, AlertTriangle, CheckCircle2, Target,
  TrendingUp, Zap, RotateCcw, ChevronRight, Award, BookOpen,
  Lightbulb, KeyRound, X, FileUp, Loader2
} from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'
import Navbar from '../components/dashboard/Navbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Progress from '../components/ui/Progress'
import { resumeApi } from '../lib/api'
import { toast } from 'react-hot-toast'

/* ─── helpers ─── */
const scoreColor = s => (s >= 80 ? '#22c55e' : s >= 60 ? '#eab308' : s >= 40 ? '#f97316' : '#ef4444')
const scoreLabel = s => (s >= 80 ? 'Excellent' : s >= 60 ? 'Good' : s >= 40 ? 'Needs Work' : 'Poor')
const priorityColor = { critical: 'bg-red-500/15 text-red-400 border-red-500/25', high: 'bg-orange-500/15 text-orange-400 border-orange-500/25', medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25', low: 'bg-blue-500/15 text-blue-400 border-blue-500/25' }

/* ─── circular score gauge ─── */
const ScoreRing = memo(({ score, size = 180 }) => {
  const r = (size - 20) / 2, c = 2 * Math.PI * r, offset = c - (score / 100) * c
  const col = scoreColor(score)
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.4, ease: 'easeOut' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span className="text-5xl font-black" style={{ color: col }} initial={{ opacity: 0, scale: .5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .4 }}>{score}</motion.span>
        <span className="text-xs text-text-muted mt-1 uppercase tracking-widest">{scoreLabel(score)}</span>
      </div>
    </div>
  )
})

/* ─── quick stat badge ─── */
const QuickStat = memo(({ icon: Icon, label, value, color = 'text-accent-blue' }) => (
  <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-bg-tertiary border border-kai-border">
    <Icon size={18} className={color} />
    <span className="text-lg font-bold text-text-primary">{value}</span>
    <span className="text-[11px] text-text-muted uppercase tracking-wide">{label}</span>
  </div>
))

/* ─── tab components ─── */
const OverviewTab = memo(({ result }) => (
  <div className="space-y-5">
    {result.overallFeedback && (
      <Card><p className="text-sm text-text-secondary leading-relaxed">{result.overallFeedback}</p></Card>
    )}
    {result.strengths?.length > 0 && (
      <Card>
        <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2"><CheckCircle2 size={16} className="text-green-400" />Strengths</h4>
        <ul className="space-y-2">{result.strengths.map((s, i) => (
          <li key={i} className="text-sm text-text-secondary flex gap-2"><span className="text-green-400 mt-0.5 shrink-0">✓</span>{s}</li>
        ))}</ul>
      </Card>
    )}
    {result.criticalIssues?.length > 0 && (
      <Card>
        <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-red-400" />Critical Issues</h4>
        <ul className="space-y-2">{result.criticalIssues.map((c, i) => (
          <li key={i} className="text-sm text-red-300 flex gap-2"><span className="mt-0.5 shrink-0">!</span>{c}</li>
        ))}</ul>
      </Card>
    )}
    {(result.actionVerbs || result.quantificationCheck) && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {result.actionVerbs && (
          <Card>
            <h4 className="font-semibold text-text-primary mb-2 flex items-center gap-2"><Zap size={14} className="text-yellow-400" />Action Verbs</h4>
            {result.actionVerbs.found?.length > 0 && <div className="flex flex-wrap gap-1.5 mb-2">{result.actionVerbs.found.map(v => <span key={v} className="px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{v}</span>)}</div>}
            {result.actionVerbs.suggested?.length > 0 && <><p className="text-xs text-text-muted mb-1">Try using:</p><div className="flex flex-wrap gap-1.5">{result.actionVerbs.suggested.map(v => <span key={v} className="px-2 py-0.5 text-xs rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20">{v}</span>)}</div></>}
          </Card>
        )}
        {result.quantificationCheck && (
          <Card>
            <h4 className="font-semibold text-text-primary mb-2 flex items-center gap-2"><TrendingUp size={14} className="text-purple-400" />Quantification</h4>
            <p className="text-sm text-text-secondary">{result.quantificationCheck.feedback || (result.quantificationCheck.hasMetrics ? 'Good use of numbers and metrics!' : 'Add more quantifiable achievements.')}</p>
          </Card>
        )}
      </div>
    )}
  </div>
))

const SectionsTab = memo(({ sectionScores }) => {
  if (!sectionScores || Object.keys(sectionScores).length === 0) return <p className="text-text-muted text-center py-8">No section data available.</p>
  return (
    <div className="space-y-3">
      {Object.entries(sectionScores).map(([name, data]) => (
        <Card key={name}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-text-primary capitalize">{name.replace(/([A-Z])/g, ' $1')}</h4>
            <span className="text-sm font-bold" style={{ color: scoreColor(data.score ?? data) }}>{data.score ?? data}%</span>
          </div>
          <Progress value={data.score ?? data} max={100} color={data.score >= 80 || data >= 80 ? 'green' : data.score >= 60 || data >= 60 ? 'yellow' : 'red'} size="sm" />
          {data.feedback && <p className="text-xs text-text-muted mt-2">{data.feedback}</p>}
        </Card>
      ))}
    </div>
  )
})

const SuggestionsTab = memo(({ suggestions, criticalIssues }) => {
  const all = useMemo(() => {
    const items = []
    if (criticalIssues?.length) criticalIssues.forEach(c => items.push({ text: c, priority: 'critical' }))
    if (suggestions?.length) suggestions.forEach(s => typeof s === 'string' ? items.push({ text: s, priority: 'medium' }) : items.push(s))
    return items.sort((a, b) => { const o = { critical: 0, high: 1, medium: 2, low: 3 }; return (o[a.priority] ?? 2) - (o[b.priority] ?? 2) })
  }, [suggestions, criticalIssues])
  if (!all.length) return <p className="text-text-muted text-center py-8">No suggestions — your resume looks great!</p>
  return (
    <div className="space-y-3">
      {all.map((s, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .04 }}
          className={`p-3 rounded-lg border ${priorityColor[s.priority] || priorityColor.medium}`}>
          <div className="flex items-start gap-2">
            <ChevronRight size={14} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm">{s.text}</p>
              <span className="text-[10px] uppercase tracking-wider opacity-70 mt-1 inline-block">{s.priority}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
})

const KeywordsTab = memo(({ present, missing }) => (
  <div className="space-y-5">
    {present?.length > 0 && (
      <Card>
        <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2"><CheckCircle2 size={14} className="text-green-400" />Found Keywords <span className="text-xs text-text-muted">({present.length})</span></h4>
        <div className="flex flex-wrap gap-2">{present.map(k => <span key={k} className="px-2.5 py-1 text-xs rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{k}</span>)}</div>
      </Card>
    )}
    {missing?.length > 0 && (
      <Card>
        <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2"><AlertTriangle size={14} className="text-orange-400" />Missing Keywords <span className="text-xs text-text-muted">({missing.length})</span></h4>
        <div className="flex flex-wrap gap-2">{missing.map(k => <span key={k} className="px-2.5 py-1 text-xs rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">{k}</span>)}</div>
        <p className="text-xs text-text-muted mt-3 flex items-center gap-1"><Lightbulb size={12} className="text-yellow-400" />Pro tip: Naturally incorporate these keywords into your experience and skills sections.</p>
      </Card>
    )}
    {!present?.length && !missing?.length && <p className="text-text-muted text-center py-8">No keyword data available.</p>}
  </div>
))

/* ═══════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                 */
/* ═══════════════════════════════════════════════════════════ */
export default function ResumeBuilderPage() {
  const [phase, setPhase] = useState('upload')   // upload | analyzing | results
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const inputRef = useRef(null)

  /* file handlers */
  const onFile = useCallback(f => {
    if (!f) return
    if (f.type !== 'application/pdf') return toast.error('Only PDF files are accepted')
    if (f.size > 5 * 1024 * 1024) return toast.error('File must be under 5 MB')
    setFile(f)
  }, [])

  const handleDrop = useCallback(e => { e.preventDefault(); setDragging(false); onFile(e.dataTransfer.files[0]) }, [onFile])
  const handleDragOver = useCallback(e => { e.preventDefault(); setDragging(true) }, [])
  const handleDragLeave = useCallback(() => setDragging(false), [])

  /* analyze */
  const analyze = useCallback(async () => {
    if (!file) return
    setPhase('analyzing')
    try {
      const fd = new FormData()
      fd.append('resume', file)
      const { data } = await resumeApi.analyze(fd)
      setResult(data)
      setPhase('results')
      toast.success(`ATS Score: ${data.atsScore}%`)
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Analysis failed — try again')
      setPhase('upload')
    }
  }, [file])

  /* reset */
  const reset = useCallback(() => { setPhase('upload'); setFile(null); setResult(null); setActiveTab('overview') }, [])

  const tabs = ['overview', 'sections', 'suggestions', 'keywords']

  return (
    <div className="page-wrapper">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Resume ATS Analyzer" />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AnimatePresence mode="wait">

            {/* ── UPLOAD PHASE ── */}
            {phase === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-xl mx-auto mt-12">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center mx-auto mb-4">
                    <FileText size={28} className="text-accent-blue" />
                  </div>
                  <h1 className="text-2xl font-bold text-text-primary">Resume ATS Analyzer</h1>
                  <p className="text-text-muted mt-2 text-sm max-w-md mx-auto">Upload your resume and get an instant AI-powered ATS compatibility score with actionable suggestions.</p>
                </div>

                <Card>
                  <div
                    onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                    onClick={() => inputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
                      ${dragging ? 'border-accent-blue bg-accent-blue/5 scale-[1.01]' : file ? 'border-green-500/40 bg-green-500/5' : 'border-kai-border hover:border-accent-blue/40 hover:bg-bg-tertiary'}`}
                  >
                    <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => onFile(e.target.files[0])} />
                    {file ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center"><FileUp size={24} className="text-green-400" /></div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{file.name}</p>
                          <p className="text-xs text-text-muted">{(file.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setFile(null) }} className="text-xs text-text-muted hover:text-red-400 flex items-center gap-1 mt-1"><X size={12} />Remove</button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-bg-tertiary border border-kai-border flex items-center justify-center">
                          <Upload size={24} className="text-text-muted" />
                        </div>
                        <div>
                          <p className="text-sm text-text-primary font-medium">Drop your PDF here or click to browse</p>
                          <p className="text-xs text-text-muted mt-1">PDF only · Max 5 MB</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button className="w-full mt-4" size="lg" disabled={!file} onClick={analyze} leftIcon={<Sparkles size={16} />}>
                    Analyze Resume
                  </Button>
                </Card>
              </motion.div>
            )}

            {/* ── ANALYZING PHASE ── */}
            {phase === 'analyzing' && (
              <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-6 mt-32">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
                    <Loader2 size={36} className="text-accent-blue animate-spin" />
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-text-primary">Analyzing your resume…</h2>
                  <p className="text-sm text-text-muted mt-1">Our AI is checking ATS compatibility, keywords, and formatting.</p>
                </div>
              </motion.div>
            )}

            {/* ── RESULTS PHASE ── */}
            {phase === 'results' && result && (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto space-y-6">

                {/* score hero */}
                <Card className="flex flex-col md:flex-row items-center gap-6 py-6 px-6">
                  <ScoreRing score={result.atsScore ?? 0} />
                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="text-xl font-bold text-text-primary">ATS Compatibility Score</h2>
                      <p className="text-sm text-text-muted mt-1">{result.overallFeedback?.slice(0, 120) || 'Upload analyzed successfully.'}{result.overallFeedback?.length > 120 ? '…' : ''}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <QuickStat icon={CheckCircle2} label="Strengths" value={result.strengths?.length ?? 0} color="text-green-400" />
                      <QuickStat icon={AlertTriangle} label="Issues" value={result.criticalIssues?.length ?? 0} color="text-red-400" />
                      <QuickStat icon={Lightbulb} label="Tips" value={result.suggestions?.length ?? 0} color="text-yellow-400" />
                      <QuickStat icon={KeyRound} label="Keywords" value={(result.presentKeywords?.length ?? 0) + (result.missingKeywords?.length ?? 0)} color="text-purple-400" />
                    </div>
                  </div>
                </Card>

                {/* tab bar */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-secondary border border-kai-border">
                  {tabs.map(t => (
                    <button key={t} onClick={() => setActiveTab(t)}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all
                        ${activeTab === t ? 'bg-accent-blue/15 text-accent-blue shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                    >{t}</button>
                  ))}
                </div>

                {/* tab content */}
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .15 }}>
                    {activeTab === 'overview' && <OverviewTab result={result} />}
                    {activeTab === 'sections' && <SectionsTab sectionScores={result.sectionScores} />}
                    {activeTab === 'suggestions' && <SuggestionsTab suggestions={result.suggestions} criticalIssues={result.criticalIssues} />}
                    {activeTab === 'keywords' && <KeywordsTab present={result.presentKeywords} missing={result.missingKeywords} />}
                  </motion.div>
                </AnimatePresence>

                {/* reset */}
                <Button variant="secondary" className="w-full" onClick={reset} leftIcon={<RotateCcw size={14} />}>
                  Analyze Another Resume
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

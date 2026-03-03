import { useContext, useEffect, useState, useMemo, memo, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import {
  Map, Code2, Brain, FileText, MessageSquare, Trophy,
  TrendingUp, Flame, Clock, ChevronRight, Zap, ArrowRight
} from 'lucide-react'
import UserContext from '../context/UserContext'
import { analyticsApi } from '../lib/api'
import Sidebar from '../components/dashboard/Sidebar'
import Navbar from '../components/dashboard/Navbar'
import Progress from '../components/ui/Progress'
import { SkeletonCard } from '../components/ui/Skeleton'
import { getGrade } from '../lib/utils'

// Lazy load heavy chart components - reduces initial bundle size by ~40KB
const RadarChart = lazy(() => 
  import('recharts').then(mod => ({ default: mod.RadarChart }))
)
const PolarGrid = lazy(() => 
  import('recharts').then(mod => ({ default: mod.PolarGrid }))
)
const PolarAngleAxis = lazy(() => 
  import('recharts').then(mod => ({ default: mod.PolarAngleAxis }))
)
const Radar = lazy(() => 
  import('recharts').then(mod => ({ default: mod.Radar }))
)
const ResponsiveContainer = lazy(() => 
  import('recharts').then(mod => ({ default: mod.ResponsiveContainer }))
)

// Static data moved outside component - prevents recreation on each render
const MODULES = [
  { label: 'Coding Tests',   path: '/coding',      icon: Code2,     color: '#d4d4d4' },
  { label: 'Quiz Arena',     path: '/quiz',         icon: Brain,     color: '#a3a3a3' },
  { label: 'Resume Builder', path: '/resume',       icon: FileText,  color: '#ffffff' },
  { label: 'Mock Interview', path: '/interview',    icon: MessageSquare, color: '#a3a3a3' },
  { label: '7-Day Roadmap',  path: '/roadmap',      icon: Map,       color: '#ffffff' },
  { label: 'Leaderboard',    path: '/leaderboard',  icon: Trophy,    color: '#d4d4d4' },
]

const SCORE_ITEMS = [
  { label: 'Coding',     weight: '35%', key: 'coding',     color: 'purple' },
  { label: 'Quiz',       weight: '25%', key: 'quiz',       color: 'yellow' },
  { label: 'Interview',  weight: '20%', key: 'interview',  color: 'blue' },
  { label: 'Soft Skills',weight: '10%', key: 'softSkills', color: 'green' },
  { label: 'Resume',     weight: '5%',  key: 'resume',     color: 'orange' },
]

// Pre-computed skeleton array - avoids Array.from() on every render
const SKELETON_ITEMS = [0, 1, 2, 3, 4, 5]

// Pre-computed style objects for StatTile accents
const STAT_TILE_STYLES = {
  '#ffffff': { track: { background: '#ffffff30' }, fill: { background: '#ffffff' } },
  '#ffffff': { track: { background: '#ffffff30' }, fill: { background: '#ffffff' } },
  '#d4d4d4': { track: { background: '#d4d4d430' }, fill: { background: '#d4d4d4' } },
  '#d4d4d4': { track: { background: '#d4d4d430' }, fill: { background: '#d4d4d4' } },
}

// Pre-computed module icon background styles
const MODULE_BG_STYLES = MODULES.reduce((acc, { color }) => {
  acc[color] = { background: `${color}18` }
  return acc
}, {})

// Memoized StatTile - prevents re-renders when parent updates but props unchanged
const StatTile = memo(function StatTile({ label, value, sub, icon, accent }) {
  const styles = STAT_TILE_STYLES[accent]
  
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-text-muted">{label}</p>
        {icon}
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-2xl font-bold text-text-primary tabular-nums">{value}</span>
        {sub && <span className="text-sm text-text-muted">{sub}</span>}
      </div>
      <div className="mt-2 h-0.5 rounded-full" style={styles.track}>
        <div className="h-full rounded-full w-[60%]" style={styles.fill} />
      </div>
    </div>
  )
})

// Memoized Row - prevents unnecessary re-renders in profile section
const Row = memo(function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-xs font-medium text-text-primary truncate max-w-[120px] text-right">
        {value}
      </span>
    </div>
  )
})

// Memoized ModuleCard - prevents re-renders when iterating
const ModuleCard = memo(function ModuleCard({ label, path, icon: Icon, color }) {
  return (
    <Link to={path}>
      <div className="card card-hover p-4 flex items-center gap-3 group">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={MODULE_BG_STYLES[color]}
        >
          <Icon size={16} color={color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate leading-tight">
            {label}
          </p>
        </div>
        <ChevronRight 
          size={13} 
          className="text-[#a3a3a3] group-hover:text-text-muted flex-shrink-0" 
        />
      </div>
    </Link>
  )
})

// Memoized ScoreItem - prevents re-renders during parent updates
const ScoreItem = memo(function ScoreItem({ label, weight, scoreKey, color, scores }) {
  const value = scores[scoreKey] ?? 0
  
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 flex-shrink-0">
        <p className="text-xs text-text-primary">{label}</p>
        <p className="text-[10px] text-[#a3a3a3]">{weight}</p>
      </div>
      <div className="flex-1">
        <Progress value={value} showLabel color={color} />
      </div>
    </div>
  )
})

// Chart fallback component
const ChartFallback = () => (
  <div className="w-full h-[200px] flex items-center justify-center">
    <div className="animate-pulse bg-gray-200 rounded-full w-32 h-32" />
  </div>
)

// Memoized SkillRadar - heavy chart component isolated
const SkillRadar = memo(function SkillRadar({ radarData }) {
  return (
    <div className="card p-5">
      <h3 className="section-title mb-3">Skill Radar</h3>
      <Suspense fallback={<ChartFallback />}>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#404040" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }} 
            />
            <Radar 
              dataKey="A" 
              stroke="#ffffff" 
              fill="#ffffff" 
              fillOpacity={0.15} 
              strokeWidth={1.5} 
            />
          </RadarChart>
        </ResponsiveContainer>
      </Suspense>
    </div>
  )
})

// Memoized Badge component
const Badge = memo(function Badge({ name }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
      {name}
    </span>
  )
})

export default function DashboardPage() {
  const { profile, overallScore, grade, sprintDay, loading } = useContext(UserContext)
  const [overview, setOverview] = useState(null)
  const [loadingOverview, setLoadingOverview] = useState(true)

  // API call with proper cleanup to prevent memory leaks
  useEffect(() => {
    const controller = new AbortController()
    
    analyticsApi.getOverview({ signal: controller.signal })
      .then(r => {
        if (!controller.signal.aborted) {
          setOverview(r.data)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingOverview(false)
        }
      })
    
    return () => controller.abort()
  }, [])

  // Memoize scores object reference
  const scores = useMemo(() => profile?.scores || {}, [profile?.scores])
  
  // Memoize first name extraction - prevents string operation on every render
  const firstName = useMemo(
    () => profile?.name?.split(' ')[0] || 'there',
    [profile?.name]
  )

  // Memoize grade info calculation
  const gradeInfo = useMemo(
    () => getGrade(overallScore ?? 0),
    [overallScore]
  )

  // Memoize radar chart data - prevents new array creation on every render
  const radarData = useMemo(() => [
    { subject: 'Coding',     A: scores.coding ?? 0 },
    { subject: 'Quiz',       A: scores.quiz ?? 0 },
    { subject: 'Interview',  A: scores.interview ?? 0 },
    { subject: 'Soft Skills',A: scores.softSkills ?? 0 },
    { subject: 'Resume',     A: scores.resume ?? 0 },
  ], [scores.coding, scores.quiz, scores.interview, scores.softSkills, scores.resume])

  // Memoize badges array
  const badges = useMemo(() => profile?.badges || [], [profile?.badges])
  
  // Memoize computed values used in multiple places
  const roundedScore = useMemo(() => Math.round(overallScore ?? 0), [overallScore])
  const currentSprintDay = sprintDay ?? 1
  const streakDays = profile?.progress?.streak ?? 0

  if (loading) {
    return (
      <div className="page-wrapper">
        <Sidebar />
        <div className="page-content">
          <Navbar title="Dashboard" />
          <main className="page-main">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SKELETON_ITEMS.map(i => <SkeletonCard key={i} />)}
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Dashboard" />
        <main className="page-main">
          <div className="space-y-6 max-w-7xl">

            {/* Welcome header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  Welcome back, {firstName}
                </h2>
                <p className="text-sm text-text-muted mt-0.5">
                  Day {currentSprintDay} of 7 &mdash; {gradeInfo?.label || 'Keep pushing'}
                </p>
              </div>
              <Link to="/roadmap">
                <button className="btn-primary flex items-center gap-2">
                  <Map size={14} />
                  Today's Tasks
                  <ChevronRight size={14} />
                </button>
              </Link>
            </div>

            {/* Stat row - using memoized StatTile */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatTile
                label="Overall Score"
                value={String(roundedScore)}
                sub="/100"
                icon={<Zap size={15} className="text-accent-blue" />}
                accent="#ffffff"
              />
              <StatTile
                label="Current Grade"
                value={grade || 'F'}
                icon={<TrendingUp size={15} className="text-accent-green" />}
                accent="#ffffff"
              />
              <StatTile
                label="Day Streak"
                value={String(streakDays)}
                sub=" days"
                icon={<Flame size={15} className="text-[#d4d4d4]" />}
                accent="#d4d4d4"
              />
              <StatTile
                label="Sprint Progress"
                value={String(currentSprintDay)}
                sub=" / 7"
                icon={<Clock size={15} className="text-[#d4d4d4]" />}
                accent="#d4d4d4"
              />
            </div>

            {/* Main grid */}
            <div className="grid lg:grid-cols-3 gap-5">

              {/* Left: modules + score breakdown */}
              <div className="lg:col-span-2 space-y-5">

                {/* Quick access - using memoized ModuleCard */}
                <div>
                  <h3 className="section-title mb-3">Practice Modules</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {MODULES.map(module => (
                      <ModuleCard key={module.path} {...module} />
                    ))}
                  </div>
                </div>

                {/* Score breakdown - using memoized ScoreItem */}
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="section-title">Score Breakdown</h3>
                    <span className="text-xs text-text-muted">Weighted composite</span>
                  </div>
                  <div className="space-y-3.5">
                    {SCORE_ITEMS.map(({ label, weight, key, color }) => (
                      <ScoreItem 
                        key={key}
                        label={label}
                        weight={weight}
                        scoreKey={key}
                        color={color}
                        scores={scores}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: radar + badges */}
              <div className="space-y-5">

                {/* Skill radar - lazy loaded */}
                <SkillRadar radarData={radarData} />

                {/* Profile summary */}
                <div className="card p-5">
                  <h3 className="section-title mb-4">Profile</h3>
                  <div className="space-y-3">
                    <Row label="Target Company" value={profile?.targetCompany || '—'} />
                    <Row label="Target Role" value={profile?.targetRole || '—'} />
                    <Row label="College" value={profile?.college || '—'} />
                    <Row label="Branch" value={profile?.branch || '—'} />
                  </div>
                  <Link 
                    to="/readiness-card" 
                    className="mt-4 flex items-center gap-1.5 text-xs text-accent-blue hover:text-[#5C97F8] transition-colors"
                  >
                    View Readiness Card <ArrowRight size={12} />
                  </Link>
                </div>

                {/* Badges - conditional rendering optimized */}
                {badges.length > 0 && (
                  <div className="card p-5">
                    <h3 className="section-title mb-3">Badges</h3>
                    <div className="flex flex-wrap gap-2">
                      {badges.map(b => (
                        <Badge key={b.key} name={b.name} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
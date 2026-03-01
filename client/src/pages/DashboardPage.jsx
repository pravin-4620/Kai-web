import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Map, Code2, Brain, FileText, MessageSquare, Trophy,
  TrendingUp, Flame, Clock, ArrowRight, ChevronRight, Zap, User
} from 'lucide-react'
import UserContext from '../context/UserContext'
import { analyticsApi } from '../lib/api'
import Sidebar from '../components/dashboard/Sidebar'
import Navbar from '../components/dashboard/Navbar'
import Card from '../components/ui/Card'
import Progress from '../components/ui/Progress'
import { SkeletonCard } from '../components/ui/Skeleton'
import { getGrade } from '../lib/utils'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'

const MODULES = [
  { label: 'Coding Tests',   path: '/coding',      icon: Code2,     color: '#8B5CF6', bg: '#8B5CF6' },
  { label: 'Quiz Arena',     path: '/quiz',         icon: Brain,     color: '#FBBF24', bg: '#FBBF24' },
  { label: 'Resume Builder', path: '/resume',       icon: FileText,  color: '#3FB950', bg: '#3FB950' },
  { label: 'Mock Interview', path: '/interview',    icon: MessageSquare, color: '#F85149', bg: '#F85149' },
  { label: '7-Day Roadmap',  path: '/roadmap',      icon: Map,       color: '#4F8EF7', bg: '#4F8EF7' },
  { label: 'Leaderboard',    path: '/leaderboard',  icon: Trophy,    color: '#FB8F44', bg: '#FB8F44' },
]

const SCORE_ITEMS = [
  { label: 'Coding',     weight: '35%', key: 'coding',     color: 'purple' },
  { label: 'Quiz',       weight: '25%', key: 'quiz',       color: 'yellow' },
  { label: 'Interview',  weight: '20%', key: 'interview',  color: 'blue' },
  { label: 'Soft Skills',weight: '10%', key: 'softSkills', color: 'green' },
  { label: 'Resume',     weight: '5%',  key: 'resume',     color: 'orange' },
]

export default function DashboardPage() {
  const { profile, overallScore, grade, sprintDay, loading } = useContext(UserContext)
  const [overview, setOverview] = useState(null)
  const [loadingOverview, setLoadingOverview] = useState(true)

  useEffect(() => {
    analyticsApi.getOverview().then(r => setOverview(r.data)).catch(() => {}).finally(() => setLoadingOverview(false))
  }, [])

  const scores = profile?.scores || {}
  const firstName = profile?.name?.split(' ')[0] || 'there'

  const gradeInfo = getGrade(overallScore ?? 0)

  const radarData = [
    { subject: 'Coding',     A: scores.coding ?? 0 },
    { subject: 'Quiz',       A: scores.quiz ?? 0 },
    { subject: 'Interview',  A: scores.interview ?? 0 },
    { subject: 'Soft Skills',A: scores.softSkills ?? 0 },
    { subject: 'Resume',     A: scores.resume ?? 0 },
  ]

  return (
    <div className="page-wrapper">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Dashboard" />
        <main className="page-main">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="space-y-6 max-w-7xl">

              {/* Welcome header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[#0F172A]">
                    Welcome back, {firstName}
                  </h2>
                  <p className="text-sm text-[#64748B] mt-0.5">
                    Day {sprintDay ?? 1} of 7 &mdash; {gradeInfo?.label || 'Keep pushing'}
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

              {/* Stat row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatTile
                  label="Overall Score"
                  value={`${Math.round(overallScore ?? 0)}`}
                  sub="/100"
                  icon={<Zap size={15} className="text-[#4F8EF7]" />}
                  accent="#4F8EF7"
                />
                <StatTile
                  label="Current Grade"
                  value={grade || 'F'}
                  icon={<TrendingUp size={15} className="text-[#3FB950]" />}
                  accent="#3FB950"
                />
                <StatTile
                  label="Day Streak"
                  value={String(profile?.progress?.streak ?? 0)}
                  sub=" days"
                  icon={<Flame size={15} className="text-[#FB8F44]" />}
                  accent="#FB8F44"
                />
                <StatTile
                  label="Sprint Progress"
                  value={`${sprintDay ?? 1}`}
                  sub=" / 7"
                  icon={<Clock size={15} className="text-[#8B5CF6]" />}
                  accent="#8B5CF6"
                />
              </div>

              {/* Main grid */}
              <div className="grid lg:grid-cols-3 gap-5">

                {/* Left: modules + score breakdown */}
                <div className="lg:col-span-2 space-y-5">

                  {/* Quick access */}
                  <div>
                    <h3 className="section-title mb-3">Practice Modules</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {MODULES.map(({ label, path, icon: Icon, color }) => (
                        <Link key={path} to={path}>
                          <div className="card card-hover p-4 flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                 style={{ background: `${color}18` }}>
                              <Icon size={16} style={{ color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#0F172A] truncate leading-tight">{label}</p>
                            </div>
                            <ChevronRight size={13} className="text-[#94A3B8] group-hover:text-[#64748B] flex-shrink-0" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Score breakdown */}
                  <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="section-title">Score Breakdown</h3>
                      <span className="text-xs text-[#64748B]">Weighted composite</span>
                    </div>
                    <div className="space-y-3.5">
                      {SCORE_ITEMS.map(({ label, weight, key, color }) => (
                        <div key={key} className="flex items-center gap-3">
                          <div className="w-28 flex-shrink-0">
                            <p className="text-xs text-[#0F172A]">{label}</p>
                            <p className="text-[10px] text-[#94A3B8]">{weight}</p>
                          </div>
                          <div className="flex-1">
                            <Progress value={scores[key] ?? 0} showLabel color={color} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: radar + badges */}
                <div className="space-y-5">

                  {/* Skill radar */}
                  <div className="card p-5">
                    <h3 className="section-title mb-3">Skill Radar</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#D9E2EC" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 10 }} />
                        <Radar dataKey="A" stroke="#4F8EF7" fill="#4F8EF7" fillOpacity={0.15} strokeWidth={1.5} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Profile summary */}
                  <div className="card p-5">
                    <h3 className="section-title mb-4">Profile</h3>
                    <div className="space-y-3">
                      <Row label="Target Company" value={profile?.targetCompany || '—'} />
                      <Row label="Target Role"    value={profile?.targetRole    || '—'} />
                      <Row label="College"        value={profile?.college        || '—'} />
                      <Row label="Branch"         value={profile?.branch         || '—'} />
                    </div>
                    <Link to="/readiness-card" className="mt-4 flex items-center gap-1.5 text-xs text-[#4F8EF7] hover:text-[#5C97F8] transition-colors">
                      View Readiness Card <ArrowRight size={12} />
                    </Link>
                  </div>

                  {/* Badges */}
                  {profile?.badges?.length > 0 && (
                    <div className="card p-5">
                      <h3 className="section-title mb-3">Badges</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.badges.map(b => (
                          <span key={b.key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#4F8EF7]/10 text-[#4F8EF7] border border-[#4F8EF7]/20">{b.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function StatTile({ label, value, sub, icon, accent }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-[#64748B]">{label}</p>
        {icon}
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-2xl font-bold text-[#0F172A] tabular-nums">{value}</span>
        {sub && <span className="text-sm text-[#64748B]">{sub}</span>}
      </div>
      <div className="mt-2 h-0.5 rounded-full" style={{ background: `${accent}30` }}>
        <div className="h-full rounded-full" style={{ width: '60%', background: accent }} />
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-xs text-[#64748B]">{label}</span>
      <span className="text-xs font-medium text-[#0F172A] truncate max-w-[120px] text-right">{value}</span>
    </div>
  )
}

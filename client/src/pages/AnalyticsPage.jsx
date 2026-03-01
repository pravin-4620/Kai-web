import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, TrendingUp, Brain, Calendar, Sparkles, Code2, Mic, Flame } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Cell
} from 'recharts'
import Sidebar from '../components/dashboard/Sidebar'
import Navbar from '../components/dashboard/Navbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Skeleton, { SkeletonCard } from '../components/ui/Skeleton'
import { analyticsApi } from '../lib/api'
import { toast } from 'react-hot-toast'

const COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#eab308', '#ef4444', '#f97316', '#06b6d4']

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null)
  const [daily, setDaily] = useState([])
  const [topics, setTopics] = useState([])
  const [heatmap, setHeatmap] = useState([])
  const [insights, setInsights] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingInsights, setLoadingInsights] = useState(false)

  useEffect(() => {
    Promise.all([
      analyticsApi.getOverview().then(r => setOverview(r.data)),
      analyticsApi.getDailyScore().then(r => setDaily(r.data.days || [])),
      analyticsApi.getTopics().then(r => setTopics(r.data.topics || [])),
      analyticsApi.getHeatmap().then(r => setHeatmap(r.data.heatmap || [])),
    ]).catch(() => toast.error('Failed to load analytics')).finally(() => setLoading(false))
  }, [])

  const loadInsights = async () => {
    setLoadingInsights(true)
    try {
      const { data } = await analyticsApi.getInsights()
      setInsights(data.insights)
    } catch {
      toast.error('Failed to get AI insights')
    } finally {
      setLoadingInsights(false)
    }
  }

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Analytics" />
        <main className="page-main">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-5xl mx-auto">
              {/* Overview stats */}
              <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Coding Tests', value: overview?.totalTests ?? 0, icon: Code2, color: 'text-purple-400' },
                  { label: 'Quizzes Taken', value: overview?.totalQuizzes ?? 0, icon: Brain, color: 'text-yellow-400' },
                  { label: 'Interviews Done', value: overview?.totalInterviews ?? 0, icon: Mic, color: 'text-blue-400' },
                  { label: 'Days Active', value: overview?.daysActive ?? 0, icon: Flame, color: 'text-orange-400' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <Card key={label} className="p-4">
                    <Icon size={18} className={color} />
                    <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
                    <p className="text-xs text-[#64748B] mt-1">{label}</p>
                  </Card>
                ))}
              </motion.div>

              {/* Daily score chart */}
              {daily.length > 0 && (
                <motion.div variants={item}>
                  <Card>
                    <h3 className="text-base font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                      <TrendingUp size={16} className="text-accent-blue" /> 7-Day Score Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={daily}>
                        <defs>
                          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
                        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 100]} />
                        <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #D9E2EC', borderRadius: 8, color: '#0F172A', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                        <Area type="monotone" dataKey="overallScore" stroke="#3b82f6" fill="url(#scoreGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Card>
                </motion.div>
              )}

              {/* Topics + radar */}
              <motion.div variants={item} className="grid lg:grid-cols-2 gap-6">
                {topics.length > 0 && (
                  <Card>
                    <h3 className="text-base font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                      <Brain size={16} className="text-yellow-400" /> Quiz Performance by Topic
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={topics} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis dataKey="topic" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={80} />
                        <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #D9E2EC', borderRadius: 8, color: '#0F172A', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                        <Bar dataKey="avgScore" radius={[0, 4, 4, 0]}>
                          {topics.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                )}

                {/* Activity heatmap */}
                {heatmap.length > 0 && (
                  <Card>
                    <h3 className="text-base font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                      <Calendar size={16} className="text-green-400" /> Activity Heatmap (30 days)
                    </h3>
                    <div className="grid grid-cols-[repeat(7,1fr)] gap-1">
                      {heatmap.map(({ date, count }) => (
                        <div
                          key={date}
                          title={`${date}: ${count} activity`}
                          className="w-full aspect-square rounded-sm cursor-default transition-colors"
                          style={{ background: count === 0 ? 'rgba(15,23,42,0.04)' : `rgba(59,130,246,${Math.min(1, count * 0.2 + 0.15)})` }}
                        />
                      ))}
                    </div>
                  </Card>
                )}
              </motion.div>

              {/* AI Insights */}
              <motion.div variants={item}>
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-[#0F172A] flex items-center gap-2">
                      <Sparkles size={16} className="text-accent-purple" /> AI Insights
                    </h3>
                    <Button variant="ghost" size="sm" loading={loadingInsights} onClick={loadInsights} leftIcon={<Sparkles size={12} />}>
                      Generate
                    </Button>
                  </div>
                  {insights ? (
                    <p className="text-sm text-[#475569] leading-relaxed whitespace-pre-wrap">{insights}</p>
                  ) : (
                    <p className="text-sm text-[#64748B]">Click "Generate" to get personalized AI insights about your performance.</p>
                  )}
                </Card>
              </motion.div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}

import { useState, useEffect, useMemo, useCallback, lazy, Suspense, memo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Brain, Calendar, Sparkles, Code2, Mic, Flame } from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'
import Navbar from '../components/dashboard/Navbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { SkeletonCard } from '../components/ui/Skeleton'
import { analyticsApi } from '../lib/api'
import { toast } from 'react-hot-toast'

// Lazy load heavy chart components
const Charts = lazy(() => import('./AnalyticsCharts'))

// Static constants moved outside component - prevents recreation on each render
const COLORS = ['#ffffff', '#d4d4d4', '#ffffff', '#a3a3a3', '#a3a3a3', '#d4d4d4', '#a3a3a3']

const ANIMATION_CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
}

const ANIMATION_ITEM = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 }
}

const TOOLTIP_STYLE = {
  background: '#FFFFFF',
  border: '1px solid #404040',
  borderRadius: 8,
  color: 'var(--text-primary)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
}

// Memoized stat card component - prevents unnecessary re-renders
const StatCard = memo(function StatCard({ label, value, icon: Icon, color }) {
  return (
    <Card className="p-4">
      <Icon size={18} className={color} />
      <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
      <p className="text-xs text-text-muted mt-1">{label}</p>
    </Card>
  )
})

// Memoized heatmap cell - prevents recreation of 30+ cells on unrelated state changes
const HeatmapCell = memo(function HeatmapCell({ date, count }) {
  const backgroundColor = useMemo(() =>
    count === 0
      ? 'rgba(15,23,42,0.04)'
      : `rgba(255,255,255,${Math.min(1, count * 0.2 + 0.15)})`,
    [count]
  )

  return (
    <div
      title={`${date}: ${count} activity`}
      className="w-full aspect-square rounded-sm cursor-default transition-colors"
      style={{ backgroundColor }}
    />
  )
})

// Initial state - reduces useState calls
const INITIAL_STATE = {
  overview: null,
  daily: [],
  topics: [],
  heatmap: [],
  insights: '',
  loading: true,
  loadingInsights: false
}

export default function AnalyticsPage() {
  const [state, setState] = useState(INITIAL_STATE)
  const { overview, daily, topics, heatmap, insights, loading, loadingInsights } = state

  // Consolidated state updater - reduces re-renders from multiple setState calls
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      // Use Promise.allSettled for better error handling - partial data still loads
      const results = await Promise.allSettled([
        analyticsApi.getOverview(),
        analyticsApi.getDailyScore(),
        analyticsApi.getTopics(),
        analyticsApi.getHeatmap(),
      ])

      if (!isMounted) return

      const updates = { loading: false }
      const errors = []

      // Process each result individually
      if (results[0].status === 'fulfilled') {
        updates.overview = results[0].value.data
      } else {
        errors.push('overview')
      }

      if (results[1].status === 'fulfilled') {
        updates.daily = results[1].value.data.days || []
      } else {
        errors.push('daily scores')
      }

      if (results[2].status === 'fulfilled') {
        updates.topics = results[2].value.data.topics || []
      } else {
        errors.push('topics')
      }

      if (results[3].status === 'fulfilled') {
        updates.heatmap = results[3].value.data.heatmap || []
      } else {
        errors.push('heatmap')
      }

      updateState(updates)

      if (errors.length > 0) {
        toast.error(`Failed to load: ${errors.join(', ')}`)
      }
    }

    fetchData()

    // Cleanup function prevents state updates on unmounted component
    return () => { isMounted = false }
  }, [updateState])

  // Memoized callback - stable reference across renders
  const loadInsights = useCallback(async () => {
    updateState({ loadingInsights: true })
    try {
      const { data } = await analyticsApi.getInsights()
      updateState({ insights: data.insights, loadingInsights: false })
    } catch {
      toast.error('Failed to get AI insights')
      updateState({ loadingInsights: false })
    }
  }, [updateState])

  // Memoize stats config - only recalculates when overview changes
  const statsConfig = useMemo(() => [
    { label: 'Total Coding Tests', value: overview?.totalTests ?? 0, icon: Code2, color: 'text-neutral-300' },
    { label: 'Quizzes Taken', value: overview?.totalQuizzes ?? 0, icon: Brain, color: 'text-neutral-300' },
    { label: 'Interviews Done', value: overview?.totalInterviews ?? 0, icon: Mic, color: 'text-neutral-300' },
    { label: 'Days Active', value: overview?.daysActive ?? 0, icon: Flame, color: 'text-neutral-300' },
  ], [overview])

  // Memoize heatmap rendering - expensive with 30+ items
  const heatmapCells = useMemo(() =>
    heatmap.map(({ date, count }) => (
      <HeatmapCell key={date} date={date} count={count} />
    )),
    [heatmap]
  )

  return (
    <div className="page-wrapper">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Analytics" />
        <main className="page-main">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <motion.div
              variants={ANIMATION_CONTAINER}
              initial="hidden"
              animate="show"
              className="space-y-6 max-w-5xl mx-auto"
            >
              {/* Overview stats */}
              <motion.div variants={ANIMATION_ITEM} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statsConfig.map((stat) => (
                  <StatCard key={stat.label} {...stat} />
                ))}
              </motion.div>

              {/* Charts loaded lazily with Suspense */}
              <Suspense fallback={<ChartSkeleton />}>
                <Charts
                  daily={daily}
                  topics={topics}
                  tooltipStyle={TOOLTIP_STYLE}
                  colors={COLORS}
                  itemVariant={ANIMATION_ITEM}
                />
              </Suspense>

              {/* Activity heatmap */}
              {heatmap.length > 0 && (
                <motion.div variants={ANIMATION_ITEM} className="grid lg:grid-cols-2 gap-6">
                  <div /> {/* Spacer for grid alignment */}
                  <Card>
                    <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                      <Calendar size={16} className="text-neutral-300" /> Activity Heatmap (30 days)
                    </h3>
                    <div className="grid grid-cols-[repeat(7,1fr)] gap-1">
                      {heatmapCells}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* AI Insights */}
              <motion.div variants={ANIMATION_ITEM}>
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                      <Sparkles size={16} className="text-accent-purple" /> AI Insights
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={loadingInsights}
                      onClick={loadInsights}
                      leftIcon={<Sparkles size={12} />}
                    >
                      Generate
                    </Button>
                  </div>
                  {insights ? (
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{insights}</p>
                  ) : (
                    <p className="text-sm text-text-muted">Click "Generate" to get personalized AI insights about your performance.</p>
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

// Simple chart skeleton
function ChartSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonCard className="h-[200px]" />
      <div className="grid lg:grid-cols-2 gap-6">
        <SkeletonCard className="h-[200px]" />
      </div>
    </div>
  )
}
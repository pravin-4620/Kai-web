import { memo } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import Card from '../components/ui/Card'
import { TrendingUp, Brain } from 'lucide-react'

const Charts = memo(function Charts({ daily, topics, tooltipStyle, colors, itemVariant }) {
  // Normalize topics: MongoDB aggregate uses _id, map to topic key for charts
  const normalizedTopics = topics.map(t => ({
    topic: t._id || t.topic || 'Unknown',
    avgScore: Math.round(t.avgScore || 0),
    count: t.count || 0,
  }))

  return (
    <>
      {/* Daily Score Trend */}
      {daily.length > 0 && (
        <motion.div variants={itemVariant}>
          <Card>
            <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-neutral-400" /> Score Trend
            </h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="codingScore"
                    name="Coding"
                    stroke="#ffffff"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#ffffff' }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="quizScore"
                    name="Quiz"
                    stroke="#d4d4d4"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#d4d4d4' }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Topic Breakdown */}
      {normalizedTopics.length > 0 && (
        <motion.div variants={itemVariant} className="grid lg:grid-cols-2 gap-6">
          {/* Bar chart */}
          <Card>
            <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Brain size={16} className="text-neutral-400" /> Topic Scores
            </h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={normalizedTopics} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="topic"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="avgScore" radius={[0, 4, 4, 0]}>
                    {normalizedTopics.map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Radar chart */}
          <Card>
            <h3 className="text-base font-semibold text-text-primary mb-4">Skill Radar</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={normalizedTopics} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="#262626" />
                  <PolarAngleAxis
                    dataKey="topic"
                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 9, fill: '#a3a3a3' }}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Radar
                    dataKey="avgScore"
                    stroke="#ffffff"
                    fill="#ffffff"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      )}
    </>
  )
})

export default Charts

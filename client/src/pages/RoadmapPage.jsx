import { useState, useEffect, useContext } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, RefreshCw, CheckCircle, Circle, BookOpen, Code2, Brain, Link2, ChevronDown, ChevronUp, Map } from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'
import Navbar from '../components/dashboard/Navbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Progress from '../components/ui/Progress'
import Skeleton from '../components/ui/Skeleton'
import { roadmapApi } from '../lib/api'
import UserContext from '../context/UserContext'
import { toast } from 'react-hot-toast'

const TASK_ICONS = { study: BookOpen, coding: Code2, quiz: Brain, resource: Link2, practice: Code2 }
const TASK_COLORS = { study: 'text-blue-500', coding: 'text-purple-500', quiz: 'text-yellow-500', resource: 'text-green-500', practice: 'text-pink-500' }

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [expandedDay, setExpandedDay] = useState(null)
  const { sprintDay } = useContext(UserContext)

  useEffect(() => {
    fetchRoadmap()
  }, [])

  useEffect(() => {
    if (sprintDay != null) setExpandedDay(sprintDay)
  }, [sprintDay])

  const fetchRoadmap = async () => {
    setLoading(true)
    try {
      const { data } = await roadmapApi.getMine()
      setRoadmap(data.roadmap)
      if (data.roadmap) setExpandedDay(sprintDay ?? 1)
    } catch (err) {
      if (err.response?.status !== 404) toast.error('Failed to load roadmap')
    } finally {
      setLoading(false)
    }
  }

  const generateRoadmap = async () => {
    setGenerating(true)
    try {
      const { data } = await roadmapApi.generate()
      setRoadmap(data.roadmap)
      setExpandedDay(1)
      toast.success('Roadmap generated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate roadmap')
    } finally {
      setGenerating(false)
    }
  }

  const toggleTask = async (dayNum, taskId, current) => {
    try {
      await roadmapApi.updateTask(taskId, { isCompleted: !current, day: dayNum })
      setRoadmap(r => ({
        ...r,
        days: r.days.map(d =>
          d.day === dayNum
            ? { ...d, tasks: d.tasks.map(t => t._id === taskId ? { ...t, isCompleted: !current } : t) }
            : d
        )
      }))
    } catch {
      toast.error('Failed to update task')
    }
  }

  const totalTasks = roadmap?.days?.reduce((acc, d) => acc + d.tasks.length, 0) ?? 0
  const completedTasks = roadmap?.days?.reduce((acc, d) => acc + d.tasks.filter(t => t.isCompleted).length, 0) ?? 0

  return (
    <div className="page-wrapper">
      <Sidebar />
      <div className="page-content">
        <Navbar title="7-Day Roadmap" />
        <main className="page-main">
          {loading ? (
            <div className="space-y-4">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : !roadmap ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] border border-[#D9E2EC] flex items-center justify-center mb-4">
                <Map size={28} className="text-[#4F8EF7]" />
              </div>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-2">No Roadmap Yet</h2>
              <p className="text-[#64748B] mb-6">Let AI build your personalized 7-day sprint plan</p>
              <Button onClick={generateRoadmap} loading={generating} leftIcon={<Sparkles size={16} />} size="lg">
                Generate My Roadmap
              </Button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-xl font-bold text-[#0F172A]">Your 7-Day Sprint</h2>
                  <p className="text-sm text-[#64748B]">{completedTasks}/{totalTasks} tasks completed</p>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={completedTasks} max={totalTasks} className="w-32" showLabel />
                  <Button variant="ghost" size="sm" onClick={generateRoadmap} loading={generating} leftIcon={<RefreshCw size={14} />}>
                    Regenerate
                  </Button>
                </div>
              </div>

              {/* Days */}
              {roadmap.days?.map(day => {
                const isToday = day.day === (sprintDay ?? 1)
                const dayCompleted = day.tasks.every(t => t.isCompleted)
                const dayProgress = day.tasks.length ? (day.tasks.filter(t => t.isCompleted).length / day.tasks.length) * 100 : 0
                const expanded = expandedDay === day.day

                return (
                  <motion.div key={day.day} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: day.day * 0.05 }}>
                    <Card
                      className={isToday ? 'border-accent-blue/40 bg-accent-blue/5' : ''}
                      onClick={() => setExpandedDay(expanded ? null : day.day)}
                    >
                      <div className="flex items-center gap-4 cursor-pointer select-none">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${dayCompleted ? 'bg-green-500 text-white' : isToday ? 'bg-accent-blue text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                          {dayCompleted ? <CheckCircle size={18} /> : `D${day.day}`}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[#0F172A]">{day.theme || `Day ${day.day}`}</p>
                            {isToday && <span className="px-2 py-0.5 text-xs rounded-full bg-accent-blue/20 text-accent-blue border border-accent-blue/30">Today</span>}
                          </div>
                          <Progress value={dayProgress} className="mt-1 w-40" size="sm" color={dayCompleted ? 'green' : 'blue'} />
                        </div>
                        <span className="text-[#94A3B8] text-xs">{day.tasks.length} tasks</span>
                        {expanded ? <ChevronUp size={16} className="text-[#94A3B8]" /> : <ChevronDown size={16} className="text-[#94A3B8]" />}
                      </div>

                      {expanded && (
                        <div className="mt-4 space-y-2 pt-4 border-t border-[#D9E2EC]" onClick={e => e.stopPropagation()}>
                          {day.tasks?.map(task => {
                            const Icon = TASK_ICONS[task.type] || Circle
                            const col = TASK_COLORS[task.type] || 'text-[#64748B]'
                            return (
                              <div key={task._id || task.title}
                                className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                                onClick={() => toggleTask(day.day, task._id, task.isCompleted)}
                              >
                                <div className="mt-0.5 flex-shrink-0">
                                  {task.isCompleted
                                    ? <CheckCircle size={16} className="text-green-500" />
                                    : <Circle size={16} className="text-[#CBD5E1]" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${task.isCompleted ? 'line-through text-[#94A3B8]' : 'text-[#0F172A]'}`}>{task.title}</p>
                                  {task.description && <p className="text-xs text-[#94A3B8] mt-0.5 truncate">{task.description}</p>}
                                  {task.resourceUrl && (
                                    <a href={task.resourceUrl} target="_blank" rel="noopener noreferrer"
                                      className="text-xs text-accent-blue hover:underline mt-1 inline-flex items-center gap-1"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      <Link2 size={10} /> Open resource
                                    </a>
                                  )}
                                </div>
                                <Icon size={14} className={`${col} flex-shrink-0 mt-1`} />
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

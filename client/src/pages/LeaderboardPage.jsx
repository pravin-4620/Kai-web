import { useState, useEffect, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Crown, Medal, Flame, TrendingUp, Users, Globe } from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'
import Navbar from '../components/dashboard/Navbar'
import Card from '../components/ui/Card'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'
import { leaderboardApi } from '../lib/api'
import AuthContext from '../context/AuthContext'
import { getGrade, cn } from '../lib/utils'

const RANK_ICONS = { 1: <Crown size={16} className="text-yellow-400" />, 2: <Medal size={16} className="text-[#475569]" />, 3: <Medal size={16} className="text-amber-600" /> }

export default function LeaderboardPage() {
  const [tab, setTab] = useState('institution') // institution | global
  const [data, setData] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useContext(AuthContext)

  useEffect(() => {
    loadData()
    leaderboardApi.getRank().then(r => setMyRank(r.data)).catch(() => {})
  }, [tab])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: res } = await (tab === 'institution' ? leaderboardApi.getInstitution() : leaderboardApi.getGlobal())
      setData(tab === 'institution' ? res.leaderboard : res.leaderboard)
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const getGradeVariant = (g) => {
    if (!g) return 'default'
    if (g.startsWith('A')) return 'green'
    if (g.startsWith('B')) return 'blue'
    if (g.startsWith('C')) return 'yellow'
    return 'red'
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Leaderboard" />
        <main className="page-main">
          <div className="max-w-3xl mx-auto">
            {/* My rank card */}
            {myRank && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <Card className="flex items-center gap-4 bg-accent-blue/5 border-accent-blue/30">
                  <div className="text-2xl font-bold text-accent-blue">#{myRank[tab === 'institution' ? 'institutionRank' : 'globalRank'] ?? '—'}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#0F172A]">Your Rank</p>
                    <p className="text-xs text-[#64748B]">{tab === 'institution' ? 'In your college' : 'Worldwide'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#0F172A]">{Math.round(myRank.overallScore ?? 0)}</p>
                    <Badge variant={getGradeVariant(getGrade(myRank.overallScore ?? 0)?.grade || 'F')} className="text-xs">{getGrade(myRank.overallScore ?? 0)?.grade || 'F'}</Badge>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Tab toggle */}
            <div className="flex rounded-xl bg-bg-secondary border border-[#D9E2EC] p-1 mb-6">
              <button onClick={() => setTab('institution')} className={cn('flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all', tab === 'institution' ? 'bg-accent-blue/20 text-accent-blue' : 'text-[#64748B] hover:text-[#0F172A]')}>
                <Users size={14} /> Institution
              </button>
              <button onClick={() => setTab('global')} className={cn('flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all', tab === 'global' ? 'bg-accent-blue/20 text-accent-blue' : 'text-[#64748B] hover:text-[#0F172A]')}>
                <Globe size={14} /> Global
              </button>
            </div>

            {/* Top 3 podium */}
            {!loading && data.length >= 3 && (
              <div className="flex items-end justify-center gap-4 mb-8 h-32">
                {[data[1], data[0], data[2]].map((entry, podiumIdx) => {
                  const heights = [24, 32, 20]
                  const realRank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3
                  return (
                    <motion.div key={entry?._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: podiumIdx * 0.1 }}
                      className={cn('flex flex-col items-center gap-2', podiumIdx === 1 && 'scale-110')}
                    >
                      <Avatar name={entry?.name} src={entry?.avatarUrl} size={podiumIdx === 1 ? 'md' : 'sm'} />
                      <p className="text-xs font-medium text-[#0F172A] truncate max-w-[80px] text-center">{entry?.name?.split(' ')[0]}</p>
                      <div className={cn('w-16 rounded-t-lg flex items-start justify-center pt-2', podiumIdx === 1 ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-[#F1F5F9] border border-[#D9E2EC]')} style={{ height: `${heights[podiumIdx] * 4}px` }}>
                        {RANK_ICONS[realRank]}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* Full list */}
            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)
              ) : data.map((entry, idx) => {
                const isMe = entry.uid === user?.uid
                const grade = getGrade(entry.overallScore ?? 0)?.grade || 'F'
                return (
                  <motion.div key={entry._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}>
                    <div className={cn('flex items-center gap-4 p-3 rounded-xl border transition-all', isMe ? 'bg-accent-blue/10 border-accent-blue/40' : 'bg-bg-secondary border-[#D9E2EC] hover:border-[#B8C8DB]')}>
                      <div className="w-8 text-center">
                        {RANK_ICONS[entry.rank] || <span className="text-sm font-bold text-[#64748B]">#{entry.rank}</span>}
                      </div>
                      <Avatar name={entry.name} src={entry.avatarUrl} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F172A] truncate">{entry.name} {isMe && '(you)'}</p>
                        <p className="text-xs text-[#64748B] truncate">{entry.college}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-1 text-xs text-orange-400">
                          <Flame size={12} />
                          {entry.streak ?? 0}
                        </div>
                        <div className="text-sm font-bold text-[#0F172A]">{Math.round(entry.overallScore ?? 0)}</div>
                        <Badge variant={getGradeVariant(grade)} className="text-xs font-bold">{grade}</Badge>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Zap, Bell } from 'lucide-react'
import UserContext from '../../context/UserContext'
import Avatar from '../ui/Avatar'

export default function Navbar({ title, actions }) {
  const { profile, overallScore } = useContext(UserContext)

  return (
    <header className="h-14 bg-[#FFFFFF] border-b border-[#D9E2EC] flex items-center px-5 lg:px-6 gap-3 sticky top-0 z-30 flex-shrink-0">
      {/* Page title */}
      {title && (
        <h1 className="text-sm font-semibold text-[#0F172A]">{title}</h1>
      )}

      {/* Custom actions slot */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}

      <div className="flex-1" />

      {/* Streak pill */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F1F5F9] border border-[#D9E2EC]">
        <Flame size={13} className="text-[#FB8F44]" />
        <span className="text-xs font-semibold text-[#0F172A] tabular-nums">
          {profile?.progress?.streak ?? 0}
        </span>
      </div>

      {/* Score pill */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F1F5F9] border border-[#D9E2EC]">
        <Zap size={13} className="text-[#4F8EF7]" />
        <span className="text-xs font-semibold text-[#0F172A] tabular-nums">
          {Math.round(overallScore ?? 0)}
        </span>
      </div>

      {/* Avatar */}
      <Link to="/readiness-card">
        <Avatar src={profile?.avatarUrl} name={profile?.name} size="sm" />
      </Link>
    </header>
  )
}

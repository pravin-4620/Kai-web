import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Zap, Bell } from 'lucide-react'
import UserContext from '../../context/UserContext'
import Avatar from '../ui/Avatar'

export default function Navbar({ title, actions }) {
  const { profile, overallScore } = useContext(UserContext)

  return (
    <header className="h-14 bg-bg-secondary border-b border-kai-border flex items-center px-5 lg:px-6 gap-3 sticky top-0 z-30 flex-shrink-0">
      {/* Page title */}
      {title && (
        <h1 className="text-sm font-semibold text-text-primary">{title}</h1>
      )}

      {/* Custom actions slot */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}

      <div className="flex-1" />

      {/* Streak pill */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-tertiary border border-kai-border">
        <Flame size={13} className="text-[#d4d4d4]" />
        <span className="text-xs font-semibold text-text-primary tabular-nums">
          {profile?.progress?.streak ?? 0}
        </span>
      </div>

      {/* Score pill */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-tertiary border border-kai-border">
        <Zap size={13} className="text-accent-blue" />
        <span className="text-xs font-semibold text-text-primary tabular-nums">
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

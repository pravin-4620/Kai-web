import { useState, useContext } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard, Map, FileText, Code2, Brain, MessageSquare, Smile,
  Trophy, BarChart3, Share2, LogOut, Menu, X, ChevronRight
} from 'lucide-react'
import AuthContext from '../../context/AuthContext'
import UserContext from '../../context/UserContext'
import { cn } from '../../lib/utils'
import Avatar from '../ui/Avatar'

const MAIN_NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/roadmap',   label: '7-Day Roadmap', icon: Map },
  { path: '/analytics', label: 'Analytics',    icon: BarChart3 },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/readiness-card', label: 'Readiness Card', icon: Share2 },
]
const MODULE_NAV = [
  { path: '/coding',          label: 'Coding Tests',   icon: Code2 },
  { path: '/quiz',            label: 'Quiz Arena',      icon: Brain },
  { path: '/mock-interview',  label: 'Mock Interview',  icon: MessageSquare },
  { path: '/resume',          label: 'Resume Builder',  icon: FileText },
  { path: '/soft-skills',     label: 'Soft Skills',     icon: Smile },
]

function NavItem({ path, label, icon: Icon, active, onClick }) {
  return (
    <Link
      to={path}
      onClick={onClick}
      className={cn('nav-item', active && 'nav-item-active')}
    >
      <Icon size={16} className="flex-shrink-0" />
      <span>{label}</span>
    </Link>
  )
}

function SidebarContent({ mobile = false, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useContext(AuthContext)
  const { profile, grade, sprintDay } = useContext(UserContext)

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  const activeLink = location.pathname

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-[#D9E2EC] flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4F8EF7] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
          K
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-heading font-bold text-[#0F172A] text-base">KAI</span>
          <span className="text-[10px] text-[#64748B] ml-2">Day {sprintDay ?? 1}/7</span>
        </div>
        {mobile && (
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[#F1F5F9] text-[#64748B]">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {/* Main */}
        <div>
          <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Main</p>
          <div className="space-y-0.5">
            {MAIN_NAV.map(item => (
              <NavItem key={item.path} {...item} active={activeLink === item.path} onClick={mobile ? onClose : undefined} />
            ))}
          </div>
        </div>

        {/* Modules */}
        <div>
          <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Practice Modules</p>
          <div className="space-y-0.5">
            {MODULE_NAV.map(item => (
              <NavItem key={item.path} {...item} active={activeLink === item.path} onClick={mobile ? onClose : undefined} />
            ))}
          </div>
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-[#D9E2EC] p-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Avatar src={profile?.avatarUrl} name={profile?.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#0F172A] truncate leading-tight">{profile?.name || 'Student'}</p>
            <p className="text-[11px] text-[#64748B] truncate">{profile?.college || 'KAI'}</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#F1F5F9] border border-[#D9E2EC]">
            <span className="text-xs font-bold text-[#4F8EF7]">{grade || 'F'}</span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-2.5 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#64748B] hover:text-[#F85149] hover:bg-[#F85149]/8 transition-all duration-150"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar — always visible, fixed width */}
      <aside className="hidden lg:flex flex-col w-56 bg-[#FFFFFF] border-r border-[#D9E2EC] flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile trigger */}
      <button
        className="lg:hidden fixed bottom-5 right-5 z-40 w-11 h-11 bg-[#4F8EF7] rounded-xl flex items-center justify-center shadow-glow"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={18} className="text-white" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-60 bg-[#FFFFFF] border-r border-[#D9E2EC]"
            >
              <SidebarContent mobile onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

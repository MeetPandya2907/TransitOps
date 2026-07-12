import { NavLink } from 'react-router'
import { LayoutDashboard, Users, Truck, Wrench, FileText, Settings, ShieldAlert, Route, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

interface NavItem {
  name: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[] // empty = all roles can see it
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard',       path: '/dashboard',   icon: LayoutDashboard, roles: [] },
  { name: 'Trips',           path: '/trips',        icon: Route,           roles: [] },
  { name: 'Fleet',           path: '/fleet',        icon: Truck,           roles: ['FleetManager'] },
  { name: 'Drivers',         path: '/drivers',      icon: Users,           roles: ['FleetManager'] },
  { name: 'Maintenance',     path: '/maintenance',  icon: Wrench,          roles: ['FleetManager', 'SafetyOfficer'] },
  { name: 'Fuel & Expenses', path: '/expenses',     icon: FileText,        roles: ['FleetManager', 'FinancialAnalyst'] },
  { name: 'Incidents',       path: '/incidents',    icon: ShieldAlert,     roles: ['SafetyOfficer', 'FleetManager'] },
  { name: 'Settings',        path: '/settings',     icon: Settings,        roles: ['FleetManager'] },
]

export function Sidebar() {
  const { profile, logout } = useAuthStore()
  const userRoles = profile?.roles ?? []

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
  }

  const visibleItems = NAV_ITEMS.filter(
    item => item.roles.length === 0 || item.roles.some(r => userRoles.includes(r))
  )

  const initials = profile?.full_name
    ?.split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

  return (
    <aside className="w-64 bg-[#111827] border-r border-white/5 flex flex-col select-none">
      {/* Brand */}
      <div className="h-16 flex items-center px-5 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Route className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">TransitOps</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
        {visibleItems.map(item => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-500/10 text-indigo-400 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
              }`
            }
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Role badge */}
      {userRoles.length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Role</span>
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
              {userRoles[0]}
            </span>
          </div>
        </div>
      )}

      {/* User + Logout */}
      <div className="p-4 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 flex items-center justify-center text-indigo-300 text-sm font-bold border border-white/10 shrink-0">
            {initials}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-semibold text-white truncate">{profile?.full_name || 'User'}</span>
            <span className="text-xs text-slate-500 truncate">{profile?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

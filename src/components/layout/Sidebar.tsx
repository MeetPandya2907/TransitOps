import { NavLink } from 'react-router'
import { LayoutDashboard, Users, Truck, Wrench, FileText, Settings, ShieldAlert, Route, LogOut, X, PieChart } from 'lucide-react'
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
  { name: 'Reports',         path: '/reports',      icon: PieChart,        roles: ['FleetManager', 'FinancialAnalyst'] },
]

export function Sidebar({ isOpen, setIsOpen }: { isOpen?: boolean, setIsOpen?: (v: boolean) => void }) {
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
    <aside 
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-white/5 flex flex-col select-none transition-transform duration-300 md:relative md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-white/5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Route className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">TransitOps</span>
        </div>
        {/* Close Button on Mobile */}
        <button 
          onClick={() => setIsOpen?.(false)}
          className="md:hidden p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
        {visibleItems.map(item => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => setIsOpen?.(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-inner'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
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
      <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700 shrink-0">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{profile?.full_name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{profile?.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            title="Sign out"
          >  <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

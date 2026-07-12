import { NavLink } from 'react-router'
import { LayoutDashboard, Users, Truck, Wrench, FileText, Settings, ShieldAlert, Route } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export function Sidebar() {
  const { profile } = useAuthStore()
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Trips', path: '/trips', icon: Route },
    { name: 'Fleet', path: '/fleet', icon: Truck },
    { name: 'Drivers', path: '/drivers', icon: Users },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Fuel & Expenses', path: '/expenses', icon: FileText },
    { name: 'Incidents', path: '/incidents', icon: ShieldAlert },
    { name: 'Settings', path: '/settings', icon: Settings },
  ]

  return (
    <div className="w-64 bg-[#151b2b] border-r border-white/5 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Route className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">TransitOps</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-indigo-500/10 text-indigo-400' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </div>
      
      <div className="p-4 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-white/10 shrink-0">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-white truncate">{profile?.full_name || 'User'}</span>
            <span className="text-xs text-slate-500 truncate">{profile?.roles?.[0] || 'Member'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

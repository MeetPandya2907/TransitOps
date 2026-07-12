import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Wrench, Fuel, Menu, X, LayoutDashboard, 
  Route, Users, Truck, 
  BarChart, TrendingUp, Droplets, 
  Settings, ShieldCheck, 
  RefreshCw, LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const opsNav = [
  { name: 'Trips', href: '/trips', icon: Route },
  { name: 'Drivers', href: '/drivers', icon: Users },
  { name: 'Vehicles', href: '/vehicles', icon: Truck },
];

const mgmtNav = [
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Fuel & Expenses', href: '/fuel', icon: Fuel },
];

const analyticsNav = [
  { name: 'Reports', href: '/reports', icon: BarChart },
  { name: 'Performance', href: '/performance', icon: TrendingUp },
  { name: 'Fuel Analytics', href: '/fuel-analytics', icon: Droplets },
];

const systemNav = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const filterNav = (items: any[]) => {
    if (!user) return items;
    if (user.role === 'Fleet Manager') return items;
    if (user.role === 'Driver') return items.filter(i => i.name === 'Trips');
    if (user.role === 'Safety Officer') return items.filter(i => ['Drivers', 'Alerts & Events'].includes(i.name));
    if (user.role === 'Financial Analyst') return items.filter(i => ['Fuel & Expenses', 'Reports'].includes(i.name));
    return items;
  };

  const renderNavGroup = (title: string, items: any[]) => {
    const filtered = filterNav(items);
    if (filtered.length === 0) return null;
    return (
    <div className="mb-6">
      <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-2 px-6">{title}</div>
      <nav className="space-y-0.5 px-3">
        {items.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                isActive
                  ? 'bg-blue-600/20 text-blue-500 font-medium border border-blue-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-white',
                'group flex items-center rounded-lg px-3 py-2 text-xs transition-all duration-200'
              )}
            >
              <item.icon
                className={cn(
                  isActive ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-300',
                  'mr-3 h-4 w-4 flex-shrink-0 transition-colors'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0e14]">
      {/* Mobile sidebar */}
      <div className={cn("fixed inset-0 z-50 flex lg:hidden", sidebarOpen ? "visible" : "invisible")}>
        <div className="fixed inset-0 bg-[#0b0e14]/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className={cn("relative flex w-full max-w-xs flex-1 flex-col bg-[#11131a] border-r border-white/5 pt-5 pb-4 transition-transform duration-300", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
          <div className="absolute right-0 top-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          <div className="flex flex-shrink-0 items-center px-4">
             <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                 <span className="text-white font-bold text-xl">T</span>
               </div>
               <span className="text-xl font-bold tracking-tight text-white">TransitOps</span>
             </div>
          </div>
          <div className="mt-5 h-0 flex-1 overflow-y-auto">
            <nav className="px-2">
               <Link to="/dashboard" className="flex items-center gap-x-3 rounded-lg bg-blue-600/20 text-blue-500 px-3 py-2 text-sm font-medium mb-6">
                 <LayoutDashboard className="h-4 w-4" /> Dashboard
               </Link>
               {renderNavGroup('Operations', opsNav)}
               {renderNavGroup('Management', mgmtNav)}
               {renderNavGroup('Analytics', analyticsNav)}
               {renderNavGroup('System', systemNav)}
            </nav>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex w-64 flex-col border-r border-white/5 bg-[#11131a] relative">
          <div className="flex h-16 flex-shrink-0 items-center px-6 border-b border-white/5">
             <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                 <span className="text-white font-bold text-xl">T</span>
               </div>
               <span className="text-xl font-bold tracking-tight text-white">TransitOps</span>
             </div>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto py-6 custom-scrollbar">
            
            <div className="px-3 mb-6">
               <Link to="/dashboard" className={cn("flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors", location.pathname === '/dashboard' || location.pathname === '/' ? "bg-blue-600/20 text-blue-500 border border-blue-500/20" : "text-slate-400 hover:bg-white/[0.04] hover:text-white")}>
                 <LayoutDashboard className={cn("h-4 w-4", location.pathname === '/dashboard' || location.pathname === '/' ? "text-blue-500" : "text-slate-500")} /> Dashboard
               </Link>
            </div>

            {renderNavGroup('Operations', opsNav)}
            {renderNavGroup('Management', mgmtNav)}
            {renderNavGroup('Analytics', analyticsNav)}
            {renderNavGroup('System', systemNav)}
          </div>

          {/* Bottom Sidebar Status */}
          <div className="p-4 border-t border-white/5 bg-[#0b0e14]/50">
             <div className="bg-[#1e2330] rounded-lg p-3 border border-white/5 mb-2">
                <div className="flex items-center gap-2 mb-1">
                   <ShieldCheck className="w-4 h-4 text-emerald-500" />
                   <span className="text-[10px] font-semibold text-slate-300">System Status</span>
                </div>
                <div className="text-[9px] text-emerald-500 ml-6">All Systems Operational</div>
             </div>
             <div className="bg-[#1e2330] rounded-lg p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                   <RefreshCw className="w-4 h-4 text-emerald-500" />
                   <span className="text-[10px] font-semibold text-slate-300">Live Sync</span>
                </div>
                <div className="text-[9px] text-emerald-500 ml-6">Connected</div>
             </div>
          </div>
          
          {/* User Profile & Logout */}
          <div className="p-4 border-t border-white/5 bg-[#11131a] flex items-center justify-between">
             <div className="flex flex-col">
                <span className="text-xs font-bold text-white truncate max-w-[140px]">{user?.email || 'User'}</span>
                <span className="text-[10px] text-amber-500 font-semibold">{user?.role || 'Guest'}</span>
             </div>
             <button onClick={logout} className="p-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors">
                <LogOut className="w-4 h-4" />
             </button>
          </div>

        </div>
      </div>

      <div className="flex flex-1 flex-col w-full min-w-0 bg-[#0b0e14]">
        {location.pathname !== '/dashboard' && location.pathname !== '/' && (
          <div className="relative z-10 flex h-16 flex-shrink-0 border-b border-white/5 bg-[#11131a]">
            <button type="button" className="border-r border-white/5 px-4 text-slate-400 focus:outline-none lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex flex-1 items-center">
                <h1 className="text-lg font-semibold text-white tracking-tight">
                  {mgmtNav.find(item => location.pathname === item.href)?.name || 'TransitOps'}
                </h1>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0b0e14] custom-scrollbar focus:outline-none relative flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Wrench, Fuel, Menu, X, LayoutDashboard, 
  Map, Route, Users, Truck, Bell, Navigation, 
  FileText, BarChart, TrendingUp, Droplets, 
  Users2, Link2, Settings, ShieldCheck, 
  RefreshCw 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const opsNav = [
  { name: 'Live Tracking', href: '#', icon: Map },
  { name: 'Trips', href: '#', icon: Route },
  { name: 'Drivers', href: '#', icon: Users },
  { name: 'Vehicles', href: '/vehicles', icon: Truck },
];

const mgmtNav = [
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Fuel & Expenses', href: '/fuel', icon: Fuel },
  { name: 'Alerts & Events', href: '#', icon: Bell },
  { name: 'Geofences', href: '#', icon: Navigation },
  { name: 'Documents', href: '#', icon: FileText },
];

const analyticsNav = [
  { name: 'Reports', href: '#', icon: BarChart },
  { name: 'Performance', href: '#', icon: TrendingUp },
  { name: 'Fuel Analytics', href: '#', icon: Droplets },
];

const systemNav = [
  { name: 'Users & Roles', href: '#', icon: Users2 },
  { name: 'Integrations', href: '#', icon: Link2 },
  { name: 'Settings', href: '#', icon: Settings },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const renderNavGroup = (title: string, items: any[]) => (
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

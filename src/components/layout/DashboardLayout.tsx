import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Map, Route, Users, Truck, Wrench, 
  Droplets, Bell, MapPin, FileText, BarChart3, TrendingUp, 
  PieChart, Settings, Shield, Link as LinkIcon, Menu, 
  Search, Calendar, BellRing, ChevronDown, ChevronLeft,
  Activity, Database, Wifi, Server, CheckCircle, CheckCircle2,
  ShieldCheck, X, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommandPalette } from '@/components/ui/command-palette';
import { ToastContainer } from '@/components/ui/toast-container';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const sidebarSections = [
  {
    title: 'OPERATIONS',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Live Tracking', path: '/tracking', icon: Map },
      { name: 'Trips', path: '/trips', icon: Route },
      { name: 'Drivers', path: '/drivers', icon: Users },
      { name: 'Vehicles', path: '/vehicles', icon: Truck },
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { name: 'Maintenance', path: '/maintenance', icon: Wrench },
      { name: 'Fuel & Expenses', path: '/fuel', icon: Droplets },
      { name: 'Alerts & Events', path: '/alerts', icon: Bell },
      { name: 'Geofences', path: '/geofences', icon: MapPin },
      { name: 'Documents', path: '/documents', icon: FileText },
    ]
  },
  {
    title: 'ANALYTICS',
    items: [
      { name: 'Reports', path: '/reports', icon: BarChart3 },
      { name: 'Performance', path: '/performance', icon: TrendingUp },
      { name: 'Fuel Analytics', path: '/fuel-analytics', icon: PieChart },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { name: 'Users & Roles', path: '/users', icon: Shield },
      { name: 'Integrations', path: '/integrations', icon: LinkIcon },
      { name: 'Settings', path: '/settings', icon: Settings },
    ]
  }
];

export default function DashboardLayout() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, setSidebarMobileOpen, setCommandPaletteOpen } = useUIStore();

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex h-screen bg-[#0B1016] text-foreground overflow-hidden font-sans">
      
      {/* Mobile Overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col border-r border-white/[0.06] bg-[#0E131A] shrink-0 transition-all duration-300 ease-out z-50",
        sidebarCollapsed ? "w-[68px]" : "w-64",
        sidebarMobileOpen
          ? "fixed inset-y-0 left-0 w-64 translate-x-0 md:relative"
          : "hidden md:flex md:relative",
        !sidebarMobileOpen && "md:flex"
      )}>
        {/* Logo */}
        <div className={cn(
          "h-16 flex items-center border-b border-white/[0.06] shrink-0 px-4",
          sidebarCollapsed ? "justify-center" : "gap-3"
        )}>
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-glow-blue">
            <Route size={18} />
          </div>
          {!sidebarCollapsed && (
            <span className="font-bold text-lg tracking-tight text-foreground">TransitOps</span>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="ml-auto p-1 rounded-md hover:bg-white/5 text-muted-foreground transition-colors hidden md:flex"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {sidebarMobileOpen && (
            <button
              onClick={() => setSidebarMobileOpen(false)}
              className="ml-auto p-1 rounded-md hover:bg-white/5 text-muted-foreground transition-colors md:hidden"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
          {sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="w-full flex justify-center p-2 rounded-md hover:bg-white/5 text-muted-foreground transition-colors mb-2"
            >
              <Menu size={18} />
            </button>
          )}
          {sidebarSections.map((section, idx) => (
            <div key={idx}>
              {!sidebarCollapsed && (
                <h4 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  {section.title}
                </h4>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      onClick={() => setSidebarMobileOpen(false)}
                      title={sidebarCollapsed ? item.name : undefined}
                      className={cn(
                        "sidebar-item group relative",
                        sidebarCollapsed && "justify-center px-2",
                        isActive(item.path) ? "sidebar-item-active" : "sidebar-item-inactive"
                      )}
                    >
                      {isActive(item.path) && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                      )}
                      <item.icon size={18} className={cn(
                        "shrink-0 transition-colors",
                        isActive(item.path) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      {!sidebarCollapsed && <span>{item.name}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        
        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="p-3 border-t border-white/[0.06] space-y-2 shrink-0">
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02]">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-bold uppercase">System Status</span>
                <span className="text-xs font-medium text-emerald-500">All Systems Operational</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02]">
              <Wifi className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Live Sync</span>
                <span className="text-xs font-medium text-emerald-500">Connected</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        
        {/* Header */}
        <header className="h-16 glass-header flex items-center justify-between px-4 sm:px-6 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground"
              onClick={() => setSidebarMobileOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 w-80 h-9 bg-white/[0.03] border border-white/[0.06] rounded-full pl-3.5 pr-3 text-sm text-muted-foreground hover:bg-white/[0.05] hover:border-white/10 transition-all"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Search vehicles, drivers, locations...</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </button>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {today}
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground rounded-full relative hover:bg-white/5">
              <BellRing size={20} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-[#0B1016]" />
            </Button>
            <div className="h-6 w-px bg-white/[0.06] mx-1" />
            <div className="flex items-center gap-2 cursor-pointer hover:bg-white/[0.03] p-1.5 rounded-full pr-3 transition-colors">
              <img src="https://i.pravatar.cc/150?u=admin" alt="Admin" className="h-8 w-8 rounded-full border border-white/10" />
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-bold leading-tight">Admin</span>
                <span className="text-[10px] text-muted-foreground">Super Admin</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
            </div>
          </div>
        </header>
        
        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0B1016] custom-scrollbar">
          <Outlet />
        </main>
        
        {/* Footer */}
        <footer className="h-10 border-t border-white/[0.06] bg-[#0E131A]/80 backdrop-blur shrink-0 flex items-center justify-between px-4 text-[10px] font-medium text-muted-foreground z-10 w-full overflow-x-auto">
          <div className="flex items-center gap-6 shrink-0">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Server Status</span>
              <span className="text-emerald-500 font-bold">Healthy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              <span>API Response</span>
              <span className="text-emerald-500 font-bold">152ms</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-emerald-500" />
              <span>Database</span>
              <span className="text-emerald-500 font-bold">Connected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi className="h-3.5 w-3.5 text-emerald-500" />
              <span>Live Sync</span>
              <span className="text-emerald-500 font-bold">Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5" />
              <span>Devices Online</span>
              <span className="text-foreground font-bold">142/150</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span>Today's Backup</span>
              <span className="text-emerald-500 font-bold">Completed</span>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0 pl-4 border-l border-white/[0.06] ml-auto">
            <span>© 2025 TransitOps. All rights reserved.</span>
            <span className="font-mono">v2.1.0</span>
          </div>
        </footer>
      </div>

      {/* Global overlays */}
      <CommandPalette />
      <ToastContainer />
    </div>
  );
}

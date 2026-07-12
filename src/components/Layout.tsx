import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Compass, 
  Wrench, 
  DollarSign, 
  BarChart3, 
  Sun, 
  Moon, 
  LogOut, 
  Menu, 
  X,
  User as UserIcon
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Check local storage or system preference
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const userRole = profile?.role;

  // Define navigation items based on RBAC rules
  const allNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'] },
    { name: 'Vehicles', path: '/vehicles', icon: Truck, roles: ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'] },
    { name: 'Drivers', path: '/drivers', icon: Users, roles: ['Fleet Manager', 'Safety Officer'] },
    { name: 'Trips', path: '/trips', icon: Compass, roles: ['Fleet Manager', 'Driver'] },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['Fleet Manager'] },
    { name: 'Expenses & Fuel', path: '/expenses', icon: DollarSign, roles: ['Fleet Manager', 'Driver', 'Financial Analyst'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['Fleet Manager', 'Financial Analyst'] },
  ];

  // Filter items matching user's role
  const navItems = allNavItems.filter(item => userRole && item.roles.includes(userRole));

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 font-sans">
      
      {/* Fixed Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-colors duration-200">
        {/* Branding header */}
        <div className="flex h-16 items-center px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-500/30">
              <Truck className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">TransitOps</h1>
              <span className="text-xxs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 block">Smart Platform</span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <IconComponent className={`h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile footer info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-semibold shadow-inner">
              {profile?.email ? profile.email[0].toUpperCase() : <UserIcon className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{profile?.email}</p>
              <span className="inline-flex items-center rounded-full bg-brand-50 dark:bg-brand-950/70 px-2 py-0.5 text-xxs font-medium text-brand-700 dark:text-brand-300 border border-brand-200/50 dark:border-brand-800/40">
                {profile?.role}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            <button
              onClick={handleSignOut}
              className="flex-1 flex items-center justify-center gap-2 h-9 px-3 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 dark:border-red-900/30 dark:hover:bg-red-950/20 dark:text-red-400 text-xs font-medium transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Page Area (Padded for fixed sidebar) */}
      <div className="flex flex-col min-h-screen md:pl-64">
        
        {/* Header (Sticky at top, Solid Background) */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-6 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 md:px-8 transition-colors duration-200 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-500 md:hidden transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
              {location.pathname === '/' ? 'Operational Dashboard' : location.pathname.substring(1).replace('-', ' ')}
            </h2>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Main Content Area (Scrolls natively with the page) */}
        <main className="flex-1 px-6 py-8 md:px-10 md:py-10 pb-20 md:pb-24 bg-transparent">
          <Outlet />
        </main>
      </div>

      {/* Mobile Menu Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="relative z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)}></div>
          
          <div className="fixed inset-y-0 left-0 flex max-w-xs w-full bg-white dark:bg-slate-900 shadow-2xl p-6 transition-transform duration-300">
            <div className="flex flex-col h-full w-full">
              {/* Drawer Branding & Exit */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-md shadow-brand-500/20">
                    <Truck className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-lg text-slate-900 dark:text-white">TransitOps</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-850 text-slate-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 py-6 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-md'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                      }`}
                    >
                      <IconComponent className="h-4.5 w-4.5 shrink-0" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Drawer Footer Profile & Actions */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold">
                    {profile?.email ? profile.email[0].toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{profile?.email}</p>
                    <span className="text-xxs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-medium">{profile?.role}</span>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 dark:border-red-900/30 dark:hover:bg-red-950/20 dark:text-red-400 text-sm font-medium transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

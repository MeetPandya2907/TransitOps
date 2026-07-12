import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Route, 
  Wrench, 
  BarChart3, 
  Settings,
  LogOut,
  CarFront,
  Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vehicles', href: '/vehicles', icon: CarFront },
  { name: 'Drivers', href: '/drivers', icon: Users },
  { name: 'Trips', href: '/trips', icon: Route },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-card px-4 py-6">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-soft">
          <Truck className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">TransitOps</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-secondary text-secondary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              )
            }
          >
            <item.icon className={cn("h-4 w-4 flex-shrink-0 transition-colors", 
              // Removed isActive logic for icon specifically, just inherited
            )} />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-1 pt-4 border-t border-border/50">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-secondary text-secondary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            )
          }
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          Settings
        </NavLink>
        <button
          className="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Log out
        </button>
      </div>
    </div>
  );
}

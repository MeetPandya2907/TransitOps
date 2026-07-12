import { Search, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();
  const path = location.pathname.split('/').filter(Boolean).pop();
  const title = path ? path.charAt(0).toUpperCase() + path.slice(1) : 'Dashboard';

  return (
    <header className="flex h-16 shrink-0 items-center gap-x-4 border-b bg-background px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center gap-x-4">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button
            type="button"
            className="flex items-center gap-2 rounded-full bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground border border-transparent hover:border-border"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:block">Search...</span>
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
          
          <button type="button" className="-m-2.5 p-2.5 text-muted-foreground hover:text-foreground transition-colors relative">
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute top-2.5 right-3 h-2 w-2 rounded-full bg-destructive ring-2 ring-background"></span>
          </button>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <button type="button" className="flex items-center gap-x-2 rounded-full p-0.5 transition-all hover:ring-2 hover:ring-primary/20">
              <img
                className="h-8 w-8 rounded-full bg-secondary object-cover"
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="User profile"
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

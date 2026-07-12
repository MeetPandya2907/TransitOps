import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Breadcrumbs({ className }: { className?: string }) {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center text-sm text-muted-foreground", className)}>
      <ol className="flex items-center space-x-2">
        <li>
          <Link to="/dashboard" className="hover:text-foreground transition-colors flex items-center">
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const isLast = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          
          // Capitalize first letter and format
          const formattedValue = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');

          return (
            <li key={to} className="flex items-center space-x-2">
              <ChevronRight className="h-3.5 w-3.5 opacity-50" />
              {isLast ? (
                <span className="font-medium text-foreground" aria-current="page">
                  {formattedValue}
                </span>
              ) : (
                <Link to={to} className="hover:text-foreground transition-colors">
                  {formattedValue}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

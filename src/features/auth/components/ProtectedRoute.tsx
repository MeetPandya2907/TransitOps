import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '@/store/authStore'

interface ProtectedRouteProps {
  allowedRoles?: string[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { session, profile, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0b0f19]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-slate-500 text-sm">Loading TransitOps...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    // If profile hasn't loaded yet but session exists — grant access optimistically
    if (profile) {
      const hasRole = profile.roles?.some(role => allowedRoles.includes(role))
      if (!hasRole) {
        return <Navigate to="/unauthorized" replace />
      }
    }
  }

  return <Outlet />
}

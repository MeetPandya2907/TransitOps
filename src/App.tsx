import { useState } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router'
import { Plus, LayoutDashboard, Route as RouteIcon, Users, Truck, Wrench, FileText } from 'lucide-react'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { TripBoard } from '@/features/trips/components/TripBoard'
import { CreateTripModal } from '@/features/trips/components/CreateTripForm'
import { useAuthStore } from '@/store/authStore'
import { useTrips } from '@/features/trips/hooks/useTrips'

import DashboardPage from '@/features/dashboard/DashboardPage'
import MaintenancePage from '@/features/maintenance/MaintenancePage'
import VehiclesPage from '@/features/vehicles/VehiclesPage'
import FuelPage from '@/features/fuel/FuelPage'
import DriversPage from '@/features/drivers/DriversPage'

// ─── Removed Inline Dashboard ──────────────────────────────────────────────────

// ─── Trips Page ───────────────────────────────────────────────────────────────
function TripsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const { profile } = useAuthStore()
  const isFleetManager = profile?.roles?.includes('FleetManager')

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Trip Management</h1>
          <p className="text-slate-500 text-sm mt-1">Drag cards to update trip status.</p>
        </div>
        {isFleetManager && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Trip
          </button>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <TripBoard />
      </div>
      <CreateTripModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  )
}

// ─── Placeholder Pages ────────────────────────────────────────────────────────
function PlaceholderPage({ title, member }: { title: string; member: string }) {
  return (
    <div className="flex flex-col space-y-4">
      <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
      <div className="rounded-2xl border border-white/5 bg-[#151b2b] p-12 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
          <Wrench className="w-8 h-8 text-indigo-400" />
        </div>
        <p className="text-slate-400 font-medium">{title}</p>
        <p className="text-slate-600 text-sm">Being built by {member}</p>
      </div>
    </div>
  )
}

// ─── Unauthorized Page ────────────────────────────────────────────────────────
function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#0b0f19]">
      <div className="text-center space-y-3">
        <h1 className="text-6xl font-black text-red-500">403</h1>
        <p className="text-white text-xl font-semibold">Access Denied</p>
        <p className="text-slate-400 text-sm max-w-xs">You don't have permission to view this page. Please contact your administrator.</p>
      </div>
    </div>
  )
}

// ─── App & Routes ─────────────────────────────────────────────────────────────
function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* All authenticated routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* FleetManager + Driver can see trips */}
          <Route element={<ProtectedRoute allowedRoles={['FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst']} />}>
            <Route path="/trips" element={<TripsPage />} />
          </Route>

          {/* These are Member 3 & 4 pages */}
          <Route path="/fleet" element={<VehiclesPage />} />
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/expenses" element={<FuelPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App

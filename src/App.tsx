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

// ─── Dashboard Page ──────────────────────────────────────────────────────────
function Dashboard() {
  const { data: trips, isLoading } = useTrips()

  const stats = {
    total: trips?.length ?? 0,
    active: trips?.filter(t => t.status === 'dispatched').length ?? 0,
    completed: trips?.filter(t => t.status === 'completed').length ?? 0,
    draft: trips?.filter(t => t.status === 'draft').length ?? 0,
  }

  return (
    <div className="flex flex-col space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back! Here's what's happening with your fleet.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Total Trips" value={isLoading ? '…' : stats.total.toString()} color="indigo" icon={<RouteIcon className="w-5 h-5" />} />
        <KpiCard label="Active Dispatches" value={isLoading ? '…' : stats.active.toString()} color="blue" icon={<Truck className="w-5 h-5" />} />
        <KpiCard label="Completed" value={isLoading ? '…' : stats.completed.toString()} color="green" icon={<LayoutDashboard className="w-5 h-5" />} />
        <KpiCard label="Pending Draft" value={isLoading ? '…' : stats.draft.toString()} color="amber" icon={<FileText className="w-5 h-5" />} />
      </div>

      {/* Recent Trips Table */}
      <div className="bg-[#151b2b] rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-base font-semibold text-white">Recent Trips</h2>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : trips?.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No trips yet. Go to Trips to create one.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 uppercase text-xs tracking-wider">
                  <th className="text-left px-6 py-3 font-medium">Route</th>
                  <th className="text-left px-6 py-3 font-medium">Driver</th>
                  <th className="text-left px-6 py-3 font-medium">Vehicle</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                  <th className="text-left px-6 py-3 font-medium">Distance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {trips?.slice(0, 8).map((trip: any) => (
                  <tr key={trip.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-slate-200 font-medium">{trip.source} → {trip.destination}</td>
                    <td className="px-6 py-4 text-slate-400">{trip.drivers?.name || '—'}</td>
                    <td className="px-6 py-4 text-slate-400">{trip.vehicles?.registration_number || '—'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={trip.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-400">{trip.planned_distance} km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/10 text-indigo-400 shadow-indigo-500/5',
    blue: 'bg-blue-500/10 text-blue-400 shadow-blue-500/5',
    green: 'bg-emerald-500/10 text-emerald-400 shadow-emerald-500/5',
    amber: 'bg-amber-500/10 text-amber-400 shadow-amber-500/5',
  }
  return (
    <div className="bg-[#151b2b] rounded-2xl border border-white/5 p-6 flex items-start gap-4">
      <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>{icon}</div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-slate-500/15 text-slate-400',
    dispatched: 'bg-blue-500/15 text-blue-400',
    completed: 'bg-emerald-500/15 text-emerald-400',
    cancelled: 'bg-red-500/15 text-red-400',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] ?? 'bg-slate-500/15 text-slate-400'}`}>
      {status}
    </span>
  )
}

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
          <Route path="/dashboard" element={<Dashboard />} />

          {/* FleetManager + Driver can see trips */}
          <Route element={<ProtectedRoute allowedRoles={['FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst']} />}>
            <Route path="/trips" element={<TripsPage />} />
          </Route>

          {/* These are Member 3 & 4 pages — accessible but placeholder */}
          <Route path="/fleet" element={<PlaceholderPage title="Vehicle Registry" member="Member 3" />} />
          <Route path="/drivers" element={<PlaceholderPage title="Driver Management" member="Member 3" />} />
          <Route path="/maintenance" element={<PlaceholderPage title="Maintenance Management" member="Member 4" />} />
          <Route path="/expenses" element={<PlaceholderPage title="Fuel & Expense Management" member="Member 4" />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App

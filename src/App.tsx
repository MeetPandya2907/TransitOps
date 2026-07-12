import { Routes, Route, Navigate } from 'react-router'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { TripBoard } from '@/features/trips/components/TripBoard'

function Dashboard() {
  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">Executive Dashboard</h1>
      </div>
      <div className="flex-1 rounded-2xl border border-white/5 bg-[#151b2b] p-8 flex items-center justify-center">
        <p className="text-slate-500">Dashboard metrics will go here...</p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateTripModal } from '@/features/trips/components/CreateTripForm'

function TripsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">Trips</h1>
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Trip
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <TripBoard />
      </div>
      <CreateTripModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/unauthorized" element={<div className="p-8 flex items-center justify-center h-screen bg-[#0b0f19] text-white"><div className="text-center"><h1 className="text-4xl font-bold text-red-500 mb-2">403</h1><p className="text-slate-400">Unauthorized Access</p></div></div>} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout>{<Outlet />}</DashboardLayout>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trips" element={<TripsPage />} />
          {/* Add other placeholder routes for sidebar items */}
          <Route path="/fleet" element={<div className="p-8 text-white">Fleet Registry (Member 3)</div>} />
          <Route path="/drivers" element={<div className="p-8 text-white">Driver Management (Member 3)</div>} />
          <Route path="/maintenance" element={<div className="p-8 text-white">Maintenance Management (Member 4)</div>} />
          <Route path="/expenses" element={<div className="p-8 text-white">Fuel & Expenses (Member 4)</div>} />
        </Route>
      </Route>
    </Routes>
  )
}

import { Outlet } from 'react-router'
export default App

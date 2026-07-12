import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function DashboardLayout() {
  return (
    <div className="flex h-screen bg-[#0b0f19] text-slate-300 font-sans overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { Search, Bell } from 'lucide-react'

export function Header() {
  return (
    <header className="h-16 shrink-0 bg-[#0b0f19] border-b border-white/5 flex items-center justify-between px-8 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-600" />
          </div>
          <input
            type="text"
            placeholder="Search trips, vehicles..."
            className="w-full bg-[#151b2b] border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-white/5 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}

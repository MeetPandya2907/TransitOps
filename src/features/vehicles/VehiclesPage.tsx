import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { 
  Truck, Search, Plus, Filter, LayoutGrid, List,
  MoreVertical, Clock, Wrench, CheckCircle2, AlertTriangle, Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function VehiclesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState('All');

  const supabaseClient = createClient();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehiclesListFull'],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Derived stats
  const totalVehicles = vehicles.length;
  const activeCount = vehicles.filter((v: any) => v.status === 'Active').length;
  const maintCount = vehicles.filter((v: any) => v.status === 'Maintenance').length;
  const offlineCount = vehicles.filter((v: any) => v.status === 'Out of Service').length;

  const filteredVehicles = vehicles.filter((v: any) => {
    const matchesSearch = `${v.license_plate} ${v.make} ${v.model}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Mock data if completely empty
  const displayVehicles = filteredVehicles.length > 0 ? filteredVehicles : (searchTerm || statusFilter !== 'All' ? [] : [
    { id: '1', license_plate: 'GJ05 AB 1234', make: 'Tata', model: 'Prima', year: 2021, current_mileage: 45000, status: 'Active' },
    { id: '2', license_plate: 'GJ12 XY 5678', make: 'Ashok Leyland', model: 'Boss', year: 2022, current_mileage: 32000, status: 'Maintenance' },
    { id: '3', license_plate: 'GJ01 KL 9001', make: 'Mahindra', model: 'Blazo', year: 2020, current_mileage: 85000, status: 'Active' },
    { id: '4', license_plate: 'GJ05 MN 3456', make: 'Volvo', model: 'FM', year: 2023, current_mileage: 12000, status: 'Out of Service' },
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0e14] text-slate-200 font-sans p-4 lg:p-6 overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
         <div>
           <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Fleet Management</h1>
           <p className="text-[11px] text-slate-400 mt-0.5">Manage and monitor your entire vehicle fleet</p>
         </div>
         <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center transition-colors">
            <Plus className="w-4 h-4 mr-2" /> Add Vehicle
         </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
         <div className="bg-[#151923] border border-white/5 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
               <Truck className="w-5 h-5" />
            </div>
            <div>
               <div className="text-2xl font-bold text-white">{totalVehicles || 4}</div>
               <div className="text-[11px] text-slate-400">Total Vehicles</div>
            </div>
         </div>
         <div className="bg-[#151923] border border-white/5 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
               <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
               <div className="text-2xl font-bold text-white">{activeCount || 2}</div>
               <div className="text-[11px] text-slate-400">Active</div>
            </div>
         </div>
         <div className="bg-[#151923] border border-white/5 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
               <Wrench className="w-5 h-5" />
            </div>
            <div>
               <div className="text-2xl font-bold text-white">{maintCount || 1}</div>
               <div className="text-[11px] text-slate-400">In Maintenance</div>
            </div>
         </div>
         <div className="bg-[#151923] border border-white/5 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
               <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
               <div className="text-2xl font-bold text-white">{offlineCount || 1}</div>
               <div className="text-[11px] text-slate-400">Offline</div>
            </div>
         </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
         <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by license plate, make, or model..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#151923] border border-white/10 text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 text-white placeholder:text-slate-500 transition-colors" 
            />
         </div>
         <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center bg-[#151923] border border-white/10 rounded-lg px-2 py-1">
               <Filter className="h-4 w-4 text-slate-400 ml-1" />
               <select 
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value)}
                 className="bg-transparent text-sm text-slate-300 outline-none py-1 focus:ring-0 border-none appearance-none cursor-pointer pl-2 pr-6"
               >
                 <option value="All">All Status</option>
                 <option value="Active">Active</option>
                 <option value="Maintenance">Maintenance</option>
                 <option value="Out of Service">Offline</option>
               </select>
            </div>
            <div className="flex items-center bg-[#151923] border border-white/10 rounded-lg p-1">
               <button onClick={() => setViewMode('grid')} className={cn("p-1.5 rounded transition-colors", viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300')}><LayoutGrid className="w-4 h-4" /></button>
               <button onClick={() => setViewMode('list')} className={cn("p-1.5 rounded transition-colors", viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300')}><List className="w-4 h-4" /></button>
            </div>
         </div>
      </div>

      {/* Vehicles Grid/List */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : displayVehicles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
           <Truck className="w-12 h-12 mb-4 opacity-20" />
           <p>No vehicles found matching your criteria.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8 overflow-y-auto custom-scrollbar">
           {displayVehicles.map((v: any, index: number) => {
              const fuelMock = 40 + (index * 13) % 60; // Mock fuel % for UI
              return (
                 <div key={v.id} className="bg-[#151923] border border-white/5 rounded-xl flex flex-col overflow-hidden hover:border-white/10 transition-colors group relative">
                    <div className="p-4 flex-1">
                       <div className="flex justify-between items-start mb-3">
                          <div>
                             <div className="text-[15px] font-bold text-white mb-0.5">{v.license_plate}</div>
                             <div className="text-[11px] text-slate-400">{v.make} {v.model} • {v.year}</div>
                          </div>
                          <span className={cn(
                             "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                             v.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                             v.status === 'Maintenance' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                             'bg-red-500/10 text-red-400 border-red-500/20'
                          )}>
                             {v.status === 'Out of Service' ? 'Offline' : v.status}
                          </span>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-5">
                          <div>
                             <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Mileage</div>
                             <div className="text-xs font-semibold text-slate-200">{Number(v.current_mileage || 0).toLocaleString()} km</div>
                          </div>
                          <div>
                             <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Fuel Level</div>
                             <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                   <div className={cn("h-full rounded-full", fuelMock < 20 ? 'bg-red-500' : 'bg-blue-500')} style={{ width: `${fuelMock}%` }}></div>
                                </div>
                                <span className="text-[10px] font-semibold text-slate-300">{fuelMock}%</span>
                             </div>
                          </div>
                          <div>
                             <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Last Service</div>
                             <div className="text-[11px] font-medium text-slate-300">12 May, 2025</div>
                          </div>
                          <div>
                             <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Next Service</div>
                             <div className="text-[11px] font-medium text-slate-300">12 Aug, 2025</div>
                          </div>
                       </div>
                    </div>
                    
                    <div className="border-t border-white/5 bg-[#11131a] p-3 flex gap-2">
                       <button className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-semibold py-1.5 rounded transition-colors">View Details</button>
                       <button className="flex-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-[11px] font-semibold py-1.5 rounded transition-colors flex items-center justify-center">
                          <Play className="w-3 h-3 mr-1 fill-current" /> Track
                       </button>
                    </div>
                 </div>
              )
           })}
        </div>
      ) : (
        <div className="bg-[#151923] border border-white/5 rounded-xl overflow-hidden overflow-x-auto">
           <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-500 bg-[#11131a] uppercase border-b border-white/5">
                 <tr>
                    <th className="px-6 py-4 font-medium">Vehicle</th>
                    <th className="px-6 py-4 font-medium">Make/Model</th>
                    <th className="px-6 py-4 font-medium">Mileage</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 text-right font-medium">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 {displayVehicles.map((v: any) => (
                    <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{v.license_plate}</td>
                       <td className="px-6 py-4 whitespace-nowrap">{v.make} {v.model} ({v.year})</td>
                       <td className="px-6 py-4 whitespace-nowrap">{Number(v.current_mileage || 0).toLocaleString()} km</td>
                       <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                             "text-[10px] font-bold px-2 py-1 rounded-full border",
                             v.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                             v.status === 'Maintenance' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                             'bg-red-500/10 text-red-400 border-red-500/20'
                          )}>
                             {v.status === 'Out of Service' ? 'Offline' : v.status}
                          </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button className="text-slate-400 hover:text-white p-1"><MoreVertical className="w-4 h-4" /></button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

    </div>
  );
}

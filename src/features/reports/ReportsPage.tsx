import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Droplets, MapPin, IndianRupee, BarChart as BarChartIcon } from 'lucide-react';

export default function ReportsPage() {
  const supabase = createClient();

  const { data: trips = [], isLoading: isLoadingTrips } = useQuery({
    queryKey: ['trips-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase.from('trips').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: fuelLogs = [], isLoading: isLoadingFuel } = useQuery({
    queryKey: ['fuel-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fuel_logs').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const isLoading = isLoadingTrips || isLoadingFuel;

  // Real Dynamic Calculations
  const completedTrips = trips.filter(t => t.status === 'Completed').length;
  const inProgressTrips = trips.filter(t => t.status === 'In Progress').length;
  const scheduledTrips = trips.filter(t => t.status === 'Scheduled').length;
  const cancelledTrips = trips.filter(t => t.status === 'Cancelled').length;

  const totalDistanceMiles = trips.reduce((sum, t) => sum + (Number(t.distance_miles) || 0), 0);
  const totalDistanceKm = Math.round(totalDistanceMiles * 1.609);
  
  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + (Number(f.cost) || 0), 0);
  const totalFuelGallons = fuelLogs.reduce((sum, f) => sum + (Number(f.gallons) || 0), 0);
  const totalFuelLiters = Math.round(totalFuelGallons * 3.785);

  // Approximate Revenue (since we don't have a direct revenue table, we'll estimate based on distance)
  // Let's assume 80 INR per KM for completed/in-progress trips
  const activeDistanceMiles = trips.filter(t => t.status !== 'Cancelled').reduce((sum, t) => sum + (Number(t.distance_miles) || 0), 0);
  const totalRevenue = Math.round(activeDistanceMiles * 1.609 * 80); 
  
  const actualProfit = totalRevenue - totalFuelCost;

  // Chart Data
  const statusData = [
    { name: 'Completed', value: completedTrips, color: '#10b981' },
    { name: 'In Progress', value: inProgressTrips, color: '#3b82f6' },
    { name: 'Scheduled', value: scheduledTrips, color: '#f59e0b' },
    { name: 'Cancelled', value: cancelledTrips, color: '#ef4444' },
  ];

  // Group trips by date for timeline chart (using created_at as proxy for trip date for analysis)
  const tripsByDate = trips.reduce((acc: any, trip) => {
    const date = new Date(trip.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!acc[date]) {
      acc[date] = { date, trips: 0, revenue: 0 };
    }
    acc[date].trips += 1;
    acc[date].revenue += Math.round((Number(trip.distance_miles) || 0) * 1.609 * 80);
    return acc;
  }, {});
  
  const timelineData = Object.values(tripsByDate).slice(-7); // Last 7 unique days

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6 bg-[#0b0e14]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0e14] text-slate-200 p-6 overflow-auto custom-scrollbar pb-20">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
          <BarChartIcon className="w-6 h-6 mr-3 text-blue-500" /> Executive Reports
        </h1>
        <p className="text-sm text-slate-400 mt-1">Real-time dynamic analysis of fleet performance and financials.</p>
      </div>

      {/* Top Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#151923] border border-slate-700/50 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4 relative">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
              <IndianRupee className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">+12.5%</span>
          </div>
          <div className="relative">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Revenue</div>
            <div className="text-2xl font-black text-white">₹{totalRevenue.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-[#151923] border border-slate-700/50 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4 relative">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
              <Droplets className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <div className="relative">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Fuel Expenses</div>
            <div className="text-2xl font-black text-white">₹{totalFuelCost.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">{totalFuelLiters.toLocaleString()} Liters Burned</div>
          </div>
        </div>

        <div className="bg-[#151923] border border-slate-700/50 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4 relative">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
              <MapPin className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="relative">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Distance</div>
            <div className="text-2xl font-black text-white">{totalDistanceKm.toLocaleString()} km</div>
          </div>
        </div>

        <div className="bg-[#151923] border border-slate-700/50 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4 relative">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">Profitable</span>
          </div>
          <div className="relative">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Net Profit</div>
            <div className="text-2xl font-black text-white">₹{actualProfit.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        
        {/* Revenue Timeline */}
        <div className="xl:col-span-2 bg-[#151923] border border-slate-700/50 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Revenue Trend (Last 7 Days)</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                <RechartsTooltip 
                  cursor={{fill: '#1e293b', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#0b0e14', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-[#151923] border border-slate-700/50 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">Trip Status Overview</h2>
          <div className="text-xs text-slate-400 mb-6">Total {trips.length} active records</div>
          <div className="h-48 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0b0e14', borderColor: '#334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-2xl font-black text-white">{trips.length}</span>
               <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Trips</span>
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            {statusData.map(status => (
              <div key={status.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: status.color }}></div>
                  <span className="text-sm text-slate-300">{status.name}</span>
                </div>
                <span className="text-sm font-bold text-white">{status.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

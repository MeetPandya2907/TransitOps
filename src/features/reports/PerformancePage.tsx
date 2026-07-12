import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, CheckCircle, XCircle, Clock, User, ShieldCheck } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

export default function PerformancePage() {
  const supabase = createClient();

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['performance-analytics-trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          drivers ( name, first_name, last_name, status )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6 bg-[#0b0e14]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // KPIs
  const totalTrips = trips.length;
  const completedTrips = trips.filter(t => t.status === 'Completed').length;
  const cancelledTrips = trips.filter(t => t.status === 'Cancelled').length;
  const completionRate = totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0;

  // Chart: Last 7 Days Activity
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    return {
      date: format(d, 'dd MMM'),
      rawDate: startOfDay(d).getTime(),
      completed: 0,
      cancelled: 0,
      active: 0
    };
  });

  trips.forEach(trip => {
    const tripDate = startOfDay(new Date(trip.created_at)).getTime();
    const day = last7Days.find(d => d.rawDate === tripDate);
    if (day) {
      if (trip.status === 'Completed') day.completed++;
      else if (trip.status === 'Cancelled') day.cancelled++;
      else day.active++; // Scheduled or In Progress
    }
  });

  // Top Performing Drivers
  const driverStatsMap: Record<string, { name: string; completed: number; total: number }> = {};
  trips.forEach(trip => {
    const driverId = trip.driver_id;
    if (!driverId) return;
    const name = trip.drivers ? (trip.drivers.first_name ? `${trip.drivers.first_name} ${trip.drivers.last_name}` : trip.drivers.name) : 'Unknown';
    if (!driverStatsMap[driverId]) {
      driverStatsMap[driverId] = { name, completed: 0, total: 0 };
    }
    driverStatsMap[driverId].total++;
    if (trip.status === 'Completed') {
      driverStatsMap[driverId].completed++;
    }
  });

  const topDrivers = Object.values(driverStatsMap)
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0e14] text-slate-200 p-6 overflow-auto custom-scrollbar pb-20">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
          <TrendingUp className="w-6 h-6 mr-3 text-blue-500" /> Performance Analytics
        </h1>
        <p className="text-sm text-slate-400 mt-1">Deep analysis of driver productivity and overall trip success rates.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#151923] border border-slate-700/50 rounded-2xl p-6 shadow-sm flex items-center relative overflow-hidden group">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 mr-4">
            <Clock className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Trips</div>
            <div className="text-2xl font-black text-white">{totalTrips}</div>
          </div>
        </div>

        <div className="bg-[#151923] border border-slate-700/50 rounded-2xl p-6 shadow-sm flex items-center relative overflow-hidden group">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 mr-4">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Completed</div>
            <div className="text-2xl font-black text-white">{completedTrips}</div>
          </div>
        </div>

        <div className="bg-[#151923] border border-slate-700/50 rounded-2xl p-6 shadow-sm flex items-center relative overflow-hidden group">
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20 mr-4">
            <XCircle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Cancelled</div>
            <div className="text-2xl font-black text-white">{cancelledTrips}</div>
          </div>
        </div>

        <div className="bg-[#151923] border border-slate-700/50 rounded-2xl p-6 shadow-sm flex items-center relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 mr-4">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Success Rate</div>
            <div className="text-2xl font-black text-white">{completionRate.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Activity Trend */}
        <div className="bg-[#151923] border border-slate-700/50 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">7-Day Trip Activity</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0b0e14', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="completed" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Completed" />
                <Area type="monotone" dataKey="active" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="Active/Scheduled" />
                <Area type="monotone" dataKey="cancelled" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Cancelled" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Drivers */}
        <div className="bg-[#151923] border border-slate-700/50 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Top Performing Drivers (By Completions)</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDrivers} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={120} />
                <Tooltip 
                  cursor={{fill: '#1e293b', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#0b0e14', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="completed" name="Completed Trips" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Driver List Table */}
      <div className="bg-[#151923] border border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center bg-[#11131a]">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Driver Leaderboard</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-[#0b0e14] text-slate-500 font-bold border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4">Driver Name</th>
                <th className="px-6 py-4 text-center">Total Trips</th>
                <th className="px-6 py-4 text-center">Completed</th>
                <th className="px-6 py-4 text-right">Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {topDrivers.length === 0 ? (
                 <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                       No trips found to generate leaderboard.
                    </td>
                 </tr>
              ) : (
                topDrivers.map((driver, idx) => (
                  <tr key={idx} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mr-3 text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      {driver.name}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {driver.total}
                    </td>
                    <td className="px-6 py-4 text-center text-emerald-400 font-bold">
                      {driver.completed}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {Math.round((driver.completed / driver.total) * 100)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

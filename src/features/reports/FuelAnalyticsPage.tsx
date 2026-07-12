import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Droplets, TrendingUp, Truck, IndianRupee, MapPin } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

export default function FuelAnalyticsPage() {
  const supabase = createClient();

  const { data: fuelLogs = [], isLoading } = useQuery({
    queryKey: ['fuel-analytics-deep'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_logs')
        .select(`
          *,
          vehicles ( license_plate, make, model )
        `)
        .order('fuel_date', { ascending: false });
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

  // Calculate Metrics
  const totalCost = fuelLogs.reduce((sum, log) => sum + (Number(log.cost) || 0), 0);
  const totalGallons = fuelLogs.reduce((sum, log) => sum + (Number(log.gallons) || 0), 0);
  const totalLiters = Math.round(totalGallons * 3.785);
  const avgCostPerLiter = totalLiters > 0 ? (totalCost / totalLiters) : 0;

  // Chart Data: Last 7 Days Cost Trend
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    return {
      date: format(d, 'dd MMM'),
      rawDate: startOfDay(d).getTime(),
      cost: 0,
      liters: 0
    };
  });

  fuelLogs.forEach(log => {
    const logDate = startOfDay(new Date(log.fuel_date)).getTime();
    const day = last7Days.find(d => d.rawDate === logDate);
    if (day) {
      day.cost += (Number(log.cost) || 0);
      day.liters += ((Number(log.gallons) || 0) * 3.785);
    }
  });

  // Chart Data: Fuel by Vehicle (Top 5)
  const vehicleFuelMap: Record<string, number> = {};
  fuelLogs.forEach(log => {
    const plate = log.vehicles?.license_plate || 'Unknown';
    vehicleFuelMap[plate] = (vehicleFuelMap[plate] || 0) + (Number(log.cost) || 0);
  });
  
  const vehicleFuelData = Object.entries(vehicleFuelMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, cost]) => ({ name, cost }));

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0e14] text-slate-200 p-6 overflow-auto custom-scrollbar pb-20">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
          <Droplets className="w-6 h-6 mr-3 text-amber-500" /> Fuel Analytics
        </h1>
        <p className="text-sm text-slate-400 mt-1">Comprehensive analysis of fleet fuel consumption based on real-time logs.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#151923] border border-slate-700/50 rounded-2xl p-6 shadow-sm flex items-center relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 mr-4">
            <IndianRupee className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Fuel Cost</div>
            <div className="text-2xl font-black text-white">₹{totalCost.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-[#151923] border border-slate-700/50 rounded-2xl p-6 shadow-sm flex items-center relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 mr-4">
            <Droplets className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Fuel Burned</div>
            <div className="text-2xl font-black text-white">{totalLiters.toLocaleString()} L</div>
          </div>
        </div>

        <div className="bg-[#151923] border border-slate-700/50 rounded-2xl p-6 shadow-sm flex items-center relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 mr-4">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Cost / Liter</div>
            <div className="text-2xl font-black text-white">₹{avgCostPerLiter.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Cost Trend */}
        <div className="bg-[#151923] border border-slate-700/50 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">7-Day Fuel Cost Trend</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0b0e14', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#0b0e14' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Highest Consumers */}
        <div className="bg-[#151923] border border-slate-700/50 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Highest Consumers (Top 5)</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicleFuelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip 
                  cursor={{fill: '#1e293b', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#0b0e14', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="cost" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Raw Data Table */}
      <div className="bg-[#151923] border border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center bg-[#11131a]">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recent Fuel Logs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-[#0b0e14] text-slate-500 font-bold border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Liters</th>
                <th className="px-6 py-4 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {fuelLogs.length === 0 ? (
                 <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                       No fuel logs found. Add logs to see them here.
                    </td>
                 </tr>
              ) : (
                fuelLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium">{format(new Date(log.fuel_date), 'dd MMM yyyy, HH:mm')}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Truck className="w-4 h-4 mr-2 text-slate-500" />
                        {log.vehicles?.license_plate || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-slate-400">
                        <MapPin className="w-3.5 h-3.5 mr-1.5" />
                        {log.location || 'Unknown Location'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-blue-400 font-medium">
                      {Math.round((Number(log.gallons) || 0) * 3.785)} L
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-400 font-bold">
                      ₹{(Number(log.cost) || 0).toLocaleString()}
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

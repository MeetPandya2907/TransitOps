import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Download, PieChart as PieChartIcon, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any[]>([]);
  const [fleetMetrics, setFleetMetrics] = useState({
    fleetUtilization: 0,
    totalOperationalCost: 0,
    avgFuelEfficiency: 0,
    avgROI: 0,
  });

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      try {
        const [vehiclesRes, tripsRes, fuelRes, maintRes] = await Promise.all([
          supabase.from('vehicles').select('*'),
          supabase.from('trips').select('*').eq('status', 'completed'),
          supabase.from('fuel_logs').select('*'),
          supabase.from('maintenance_logs').select('*'),
        ]);

        const vehicles = vehiclesRes.data || [];
        const trips = tripsRes.data || [];
        const fuels = fuelRes.data || [];
        const maints = maintRes.data || [];

        // Aggregate per vehicle
        let totalCostAll = 0;
        let totalUtilCount = 0; // Vehicles on trip or in shop
        
        const data = vehicles.map(v => {
          const vTrips = trips.filter(t => t.vehicle_id === v.id);
          const vFuels = fuels.filter(f => f.vehicle_id === v.id);
          const vMaints = maints.filter(m => m.vehicle_id === v.id);

          const totalDistance = vTrips.reduce((sum, t) => sum + Number(t.planned_distance || 0), 0);
          const totalRevenue = vTrips.reduce((sum, t) => sum + Number(t.revenue || 0), 0);
          
          const totalFuelLiters = vFuels.reduce((sum, f) => sum + Number(f.liters || 0), 0);
          const totalFuelCost = vFuels.reduce((sum, f) => sum + Number(f.cost || 0), 0);
          
          const totalMaintCost = vMaints.reduce((sum, m) => sum + Number(m.cost || 0), 0);
          
          const operationalCost = totalFuelCost + totalMaintCost;
          totalCostAll += operationalCost;
          
          if (v.status === 'on_trip' || v.status === 'in_shop') {
            totalUtilCount++;
          }

          const fuelEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters) : 0;
          
          const acqCost = Number(v.acquisition_cost || 1); // prevent division by zero
          const roi = acqCost > 0 ? ((totalRevenue - operationalCost) / acqCost) * 100 : 0;

          return {
            id: v.id,
            name: `${v.name_model} (${v.registration_number})`,
            totalDistance,
            totalFuelLiters,
            totalFuelCost,
            totalMaintCost,
            operationalCost,
            totalRevenue,
            fuelEfficiency,
            roi,
          };
        });

        // Filter out zero-data vehicles for cleaner charts
        const activeData = data.filter(d => d.totalDistance > 0 || d.operationalCost > 0);
        
        setReportData(activeData.length > 0 ? activeData : data);
        
        const util = vehicles.length > 0 ? (totalUtilCount / vehicles.length) * 100 : 0;
        const avgFe = data.reduce((sum, d) => sum + d.fuelEfficiency, 0) / (data.filter(d => d.fuelEfficiency > 0).length || 1);
        const avgRoi = data.reduce((sum, d) => sum + d.roi, 0) / (data.length || 1);

        setFleetMetrics({
          fleetUtilization: util,
          totalOperationalCost: totalCostAll,
          avgFuelEfficiency: avgFe,
          avgROI: avgRoi,
        });

      } catch (err) {
        console.error('Error fetching report data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const exportCSV = () => {
    if (reportData.length === 0) return;
    const headers = ['Vehicle', 'Distance (km)', 'Fuel (L)', 'Operational Cost ($)', 'Revenue ($)', 'Fuel Efficiency (km/L)', 'ROI (%)'];
    const csvContent = "data:text/csv;charset=utf-8," + 
      headers.join(",") + "\\n" +
      reportData.map(d => 
        `"${d.name}",${d.totalDistance},${d.totalFuelLiters},${d.operationalCost},${d.totalRevenue},${d.fuelEfficiency.toFixed(2)},${d.roi.toFixed(2)}`
      ).join("\\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "fleet_reports.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-8 text-slate-500 dark:text-slate-400">Compiling analytics reports...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel bg-white dark:bg-[#151b2b] rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Fleet performance, operational costs, and ROI metrics.</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Fleet Utilization" value={`${fleetMetrics.fleetUtilization.toFixed(1)}%`} icon={PieChartIcon} color="text-indigo-500" bg="bg-indigo-50 dark:bg-indigo-500/10" />
        <KpiCard title="Avg Fuel Efficiency" value={`${fleetMetrics.avgFuelEfficiency.toFixed(2)} km/L`} icon={Activity} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" />
        <KpiCard title="Total Op Cost" value={`$${fleetMetrics.totalOperationalCost.toLocaleString()}`} icon={DollarSign} color="text-rose-500" bg="bg-rose-50 dark:bg-rose-500/10" />
        <KpiCard title="Avg Fleet ROI" value={`${fleetMetrics.avgROI.toFixed(1)}%`} icon={TrendingUp} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
      </div>

      {/* Charts & Tables Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cost vs Revenue Chart */}
        <div className="lg:col-span-2 glass-panel bg-white dark:bg-[#151b2b] rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6 uppercase tracking-wider">Operational Cost vs Revenue by Vehicle</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis dataKey="name" stroke="currentColor" className="text-slate-500 dark:text-slate-400 text-xs" tickLine={false} axisLine={false} tickFormatter={(val) => val.split(' ')[0]} />
                <YAxis stroke="currentColor" className="text-slate-500 dark:text-slate-400 text-xs" tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgb(30, 41, 59)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#fff' }}
                />
                <Bar dataKey="operationalCost" name="Op Cost" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalRevenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROI Breakdown */}
        <div className="glass-panel bg-white dark:bg-[#151b2b] rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Vehicle ROI Performance</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4" style={{ scrollbarWidth: 'thin' }}>
            {reportData.sort((a, b) => b.roi - a.roi).map(d => (
              <div key={d.id} className="flex flex-col gap-1 border-b border-slate-100 dark:border-white/5 pb-3 last:border-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{d.name.split(' ')[0]}</span>
                  <span className={cn("text-sm font-bold", d.roi >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {d.roi > 0 ? '+' : ''}{d.roi.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full", d.roi >= 0 ? "bg-emerald-500" : "bg-rose-500")}
                    style={{ width: `${Math.min(Math.abs(d.roi), 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="glass-panel bg-white dark:bg-[#151b2b] rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Vehicle Performance Data</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-white/5">
            <thead className="bg-slate-50 dark:bg-white/[0.02]">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dist (km)</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fuel (L)</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Op Cost</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Efficiency</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {reportData.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-200">{d.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-600 dark:text-slate-400">{d.totalDistance.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-600 dark:text-slate-400">{d.totalFuelLiters.toFixed(1)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-rose-600 dark:text-rose-400">${d.operationalCost.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-600 dark:text-emerald-400">${d.totalRevenue.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-600 dark:text-slate-400">{d.fuelEfficiency.toFixed(2)} km/L</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
                    <span className={d.roi >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                      {d.roi > 0 ? '+' : ''}{d.roi.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color, bg }: { title: string, value: string, icon: any, color: string, bg: string }) {
  return (
    <div className="glass-panel bg-white dark:bg-[#151b2b] rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-white/5 flex items-center gap-4">
      <div className={cn("p-3 rounded-xl", bg)}>
        <Icon className={cn("w-6 h-6", color)} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Download, BarChart2 } from 'lucide-react';

interface VehiclePerformanceReport {
  id: string;
  registration_number: string;
  name: string;
  type: string;
  acquisition_cost: number;
  trips_count: number;
  total_distance: number;
  total_revenue: number;
  fuel_cost: number;
  fuel_liters: number;
  maintenance_cost: number;
  total_expenses: number;
  fuel_efficiency: number; // km/L
  roi: number; // %
}

export const Reports: React.FC = () => {
  const [reports, setReports] = useState<VehiclePerformanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const generateReportsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all assets
      const { data: vehicles, error: vError } = await supabase.from('vehicles').select('*');
      if (vError) throw vError;

      // 2. Fetch all completed trips
      const { data: trips, error: tError } = await supabase
        .from('trips')
        .select('*')
        .eq('status', 'Completed');
      if (tError) throw tError;

      // 3. Fetch all expenses
      const { data: expenses, error: eError } = await supabase.from('expenses').select('*');
      if (eError) throw eError;

      // 4. Map and calculate indicators per vehicle
      const calculatedReports: VehiclePerformanceReport[] = (vehicles || []).map((v: any) => {
        const vehicleTrips = (trips || []).filter((t: any) => t.vehicle_id === v.id);
        const vehicleExpenses = (expenses || []).filter((e: any) => e.vehicle_id === v.id);

        const tripsCount = vehicleTrips.length;
        const totalDistance = vehicleTrips.reduce((sum: number, t: any) => sum + Number(t.planned_distance), 0);
        const totalRevenue = vehicleTrips.reduce((sum: number, t: any) => sum + Number(t.revenue), 0);

        const fuelCost = vehicleExpenses
          .filter((e: any) => e.type === 'Fuel')
          .reduce((sum: number, e: any) => sum + Number(e.cost), 0);

        const fuelLiters = vehicleTrips.reduce((sum: number, t: any) => sum + Number(t.fuel_consumed || 0), 0);

        const maintenanceCost = vehicleExpenses
          .filter((e: any) => e.type === 'Maintenance')
          .reduce((sum: number, e: any) => sum + Number(e.cost), 0);

        const totalExpenses = vehicleExpenses.reduce((sum: number, e: any) => sum + Number(e.cost), 0);

        // Fuel Efficiency = Distance / Fuel
        const fuelEfficiency = fuelLiters > 0 ? Number((totalDistance / fuelLiters).toFixed(2)) : 0;

        // Vehicle ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
        const acquisitionCost = Number(v.acquisition_cost);
        let roi = 0;
        if (acquisitionCost > 0) {
          roi = Number((((totalRevenue - (maintenanceCost + fuelCost)) / acquisitionCost) * 100).toFixed(1));
        }

        return {
          id: v.id,
          registration_number: v.registration_number,
          name: v.name,
          type: v.type,
          acquisition_cost: acquisitionCost,
          trips_count: tripsCount,
          total_distance: totalDistance,
          total_revenue: totalRevenue,
          fuel_cost: fuelCost,
          fuel_liters: fuelLiters,
          maintenance_cost: maintenanceCost,
          total_expenses: totalExpenses,
          fuel_efficiency: fuelEfficiency,
          roi: roi,
        };
      });

      setReports(calculatedReports);
    } catch (err: any) {
      console.error('Error generating reports:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReportsData();
  }, []);

  const handleExportCSV = () => {
    if (reports.length === 0) return;

    const headers = [
      'Registration Number',
      'Model Name',
      'Type',
      'Acquisition Cost ($)',
      'Trips Completed',
      'Total Distance (km)',
      'Total Revenue ($)',
      'Fuel Spend ($)',
      'Fuel Logged (Liters)',
      'Maintenance Spend ($)',
      'Total Expenses ($)',
      'Fuel Efficiency (km/L)',
      'Vehicle ROI (%)',
    ];

    const rows = filteredReports.map((r) => [
      r.registration_number,
      r.name,
      r.type,
      r.acquisition_cost,
      r.trips_count,
      r.total_distance,
      r.total_revenue,
      r.fuel_cost,
      r.fuel_liters,
      r.maintenance_cost,
      r.total_expenses,
      r.fuel_efficiency,
      r.roi,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TransitOps_Fleet_Performance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.registration_number.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || r.type.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      
      {/* Search and Filters */}
      <div className="glass-panel rounded-2xl p-5 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by name or reg #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:border-slate-800 dark:bg-slate-900/40"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:text-white"
            >
              <option value="All">All Vehicle Types</option>
              <option value="Truck">Truck</option>
              <option value="Van">Van</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filteredReports.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-650 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/10 transition-all disabled:opacity-50 hover:scale-[1.01]"
        >
          <Download className="h-4 w-4" />
          Export to CSV
        </button>
      </div>

      {/* Reports Table view */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center shadow-sm">
          <BarChart2 className="h-10 w-10 mx-auto text-slate-350 dark:text-slate-655 mb-3" />
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Analytics Data</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">There are no completed trips recorded yet.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/40 overflow-hidden">
          {/* Scrollable container for tables with multiple columns */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800/80">
              <thead className="bg-slate-50/70 dark:bg-slate-900/30">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Asset Info</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acq Cost</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trips</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Distance</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fuel Cost</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Maint Cost</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Spend</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fuel Efficiency</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ROI (%)</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900/10 divide-y divide-slate-200/80 dark:divide-slate-800/50 text-xs font-medium">
                {filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 dark:text-white block">{r.name}</span>
                      <span className="text-xxs text-slate-450 dark:text-slate-550 font-mono">Reg: {r.registration_number}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700 dark:text-slate-300">${r.acquisition_cost.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700 dark:text-slate-300">{r.trips_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700 dark:text-slate-300">{r.total_distance.toLocaleString()} km</td>
                    <td className="px-6 py-4 whitespace-nowrap text-emerald-600 dark:text-emerald-400 font-bold">${r.total_revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-650 dark:text-slate-350">${r.fuel_cost.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-650 dark:text-slate-350">${r.maintenance_cost.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-rose-650 dark:text-rose-400">${r.total_expenses.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-800 dark:text-slate-300 font-mono">{r.fuel_efficiency > 0 ? `${r.fuel_efficiency} km/L` : '--'}</td>
                    <td className={`px-6 py-4 whitespace-nowrap font-bold ${r.roi >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-650 dark:text-rose-450'}`}>
                      {r.roi}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

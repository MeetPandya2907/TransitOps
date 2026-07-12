import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Vehicle, Driver, Trip, Expense } from '../types/database.types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { Truck, Users, Navigation, Wrench, AlertTriangle, TrendingUp, DollarSign, FileText } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('All');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [vRes, dRes, tRes, eRes] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('drivers').select('*'),
        supabase.from('trips').select('*'),
        supabase.from('expenses').select('*')
      ]);

      if (vRes.error) throw vRes.error;
      if (dRes.error) throw dRes.error;
      if (tRes.error) throw tRes.error;
      if (eRes.error) throw eRes.error;

      setVehicles(vRes.data || []);
      setDrivers(dRes.data || []);
      setTrips(tRes.data || []);
      setExpenses(eRes.data || []);
    } catch (err: any) {
      console.error('Error fetching dashboard statistics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter vehicles first based on selected filter
  const filteredVehicles = vehicles.filter(v => 
    vehicleTypeFilter === 'All' || v.type.toLowerCase() === vehicleTypeFilter.toLowerCase()
  );

  const filteredVehiclesIds = new Set(filteredVehicles.map(v => v.id));

  // Filter trips and expenses to match the filtered vehicles
  const filteredTrips = trips.filter(t => filteredVehiclesIds.has(t.vehicle_id));
  const filteredExpenses = expenses.filter(e => filteredVehiclesIds.has(e.vehicle_id));

  // Compute KPIs
  const totalVehiclesCount = filteredVehicles.length;
  const activeVehiclesCount = filteredVehicles.filter(v => v.status === 'On Trip').length;
  const availableVehiclesCount = filteredVehicles.filter(v => v.status === 'Available').length;
  const maintenanceVehiclesCount = filteredVehicles.filter(v => v.status === 'In Shop').length;
  const retiredVehiclesCount = filteredVehicles.filter(v => v.status === 'Retired').length;

  const activeTripsCount = filteredTrips.filter(t => t.status === 'Dispatched').length;
  const pendingTripsCount = filteredTrips.filter(t => t.status === 'Draft').length;

  const driversOnDutyCount = drivers.filter(d => d.status === 'On Trip' || d.status === 'Available').length;
  const driversCount = drivers.length;

  const fleetUtilizationRate = totalVehiclesCount > 0 
    ? Math.round((activeVehiclesCount / (totalVehiclesCount - retiredVehiclesCount || 1)) * 100) 
    : 0;

  const totalSpend = filteredExpenses.reduce((sum, e) => sum + Number(e.cost), 0);
  const totalRevenue = filteredTrips.filter(t => t.status === 'Completed').reduce((sum, t) => sum + Number(t.revenue), 0);
  
  // Format Data for charts
  // 1. Vehicle Status distribution (Pie Chart)
  const vehicleStatusData = [
    { name: 'Available', value: availableVehiclesCount, color: '#10b981' },
    { name: 'On Trip', value: activeVehiclesCount, color: '#3b82f6' },
    { name: 'In Shop', value: maintenanceVehiclesCount, color: '#f59e0b' },
    { name: 'Retired', value: retiredVehiclesCount, color: '#ef4444' }
  ].filter(item => item.value > 0);

  // 2. Expense breakdown by category (Bar Chart)
  const expenseCategories = ['Fuel', 'Maintenance', 'Toll', 'Insurance', 'Other'];
  const expenseBreakdownData = expenseCategories.map(cat => {
    const cost = filteredExpenses
      .filter(e => e.type.toLowerCase() === cat.toLowerCase())
      .reduce((sum, e) => sum + Number(e.cost), 0);
    return { name: cat, cost };
  }).filter(item => item.cost > 0);

  // 3. Operational Income vs Expenses (Recent timeline - last 7 entries)
  const recentCompletedTrips = filteredTrips
    .filter(t => t.status === 'Completed')
    .slice(0, 7)
    .reverse();

  const financialTrendData = recentCompletedTrips.map((t, idx) => {
    // get expenses related to this trip if any
    const tripExpenses = filteredExpenses
      .filter(e => e.trip_id === t.id)
      .reduce((sum, e) => sum + Number(e.cost), 0);

    return {
      name: `Trip ${idx + 1}`,
      Revenue: Number(t.revenue),
      Expense: tripExpenses,
      Net: Number(t.revenue) - tripExpenses
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Filters bar */}
      <div className="glass-panel rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-none">Operational Metrics</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time overview of fleet activities and financials.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Filter Fleet Type:</label>
          <select
            value={vehicleTypeFilter}
            onChange={(e) => setVehicleTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="All">All Types</option>
            <option value="Truck">Trucks Only</option>
            <option value="Van">Vans Only</option>
            <option value="Sedan">Sedans Only</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Dashboard KPI Grid */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            
            {/* KPI 1: Fleet Utilization */}
            <div className="glass-panel rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-wide">Fleet Utilization</span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{fleetUtilizationRate}%</p>
              </div>
            </div>

            {/* KPI 2: Active Vehicles */}
            <div className="glass-panel rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-wide">Active / Total</span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {activeVehiclesCount} / {totalVehiclesCount - retiredVehiclesCount}
                </p>
              </div>
            </div>

            {/* KPI 3: Maintenance Shop */}
            <div className="glass-panel rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-wide">In Maintenance</span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{maintenanceVehiclesCount} Assets</p>
              </div>
            </div>

            {/* KPI 4: Drivers Status */}
            <div className="glass-panel rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-wide">Drivers On Duty</span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {driversOnDutyCount} / {driversCount}
                </p>
              </div>
            </div>

            {/* KPI 5: Active Deliveries */}
            <div className="glass-panel rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-655 dark:bg-sky-950/60 dark:text-sky-400">
                <Navigation className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-wide">Dispatched Trips</span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{activeTripsCount} Active</p>
              </div>
            </div>

            {/* KPI 6: Pending Trips */}
            <div className="glass-panel rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-450">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-wide">Pending Schedules</span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{pendingTripsCount} Drafts</p>
              </div>
            </div>

            {/* KPI 7: Financial Revenue */}
            <div className="glass-panel rounded-2xl p-5 shadow-sm flex items-center gap-4 col-span-2 sm:col-span-1">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100/60 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-350">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-wide">Gross Income</span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">${totalRevenue.toLocaleString()}</p>
              </div>
            </div>

            {/* KPI 8: Financial Expenses */}
            <div className="glass-panel rounded-2xl p-5 shadow-sm flex items-center gap-4 col-span-2 sm:col-span-1">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-450">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-wide">Gross Spend</span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">${totalSpend.toLocaleString()}</p>
              </div>
            </div>

          </div>

          {/* Charts Display */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            {/* Chart 1: Revenue vs Expenses Trend */}
            <div className="glass-panel rounded-2xl p-5 shadow-sm lg:col-span-2 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Deliveries Profit Trend</h3>
                <p className="text-xxs text-slate-400 mt-0.5">Compares invoice revenue with specific logged costs.</p>
              </div>
              <div className="h-72">
                {financialTrendData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">No completed trips trend data yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={financialTrendData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-900" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" />
                      <Area type="monotone" dataKey="Revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                      <Area type="monotone" dataKey="Expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Fleet Status Allocation */}
            <div className="glass-panel rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Fleet Asset Allocation</h3>
                <p className="text-xxs text-slate-400 mt-0.5">Distribution of vehicles status in fleet.</p>
              </div>
              <div className="h-72 flex flex-col items-center justify-center">
                {vehicleStatusData.length === 0 ? (
                  <div className="text-xs text-slate-400">No vehicle data logged.</div>
                ) : (
                  <>
                    <div className="w-full h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={vehicleStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {vehicleStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs font-semibold mt-4">
                      {vehicleStatusData.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-650 dark:text-slate-350">{item.name}: {item.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Chart 3: Expense Categories Distribution */}
            <div className="glass-panel rounded-2xl p-5 shadow-sm lg:col-span-3 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Expenditures Breakdown</h3>
                <p className="text-xxs text-slate-400 mt-0.5">Aggregated costs by expenditure category.</p>
              </div>
              <div className="h-64">
                {expenseBreakdownData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">No operational expenses logged yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expenseBreakdownData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-900" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip formatter={(value) => value !== undefined && value !== null ? `$${Number(value).toLocaleString()}` : '$0'} />
                      <Bar dataKey="cost" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
};

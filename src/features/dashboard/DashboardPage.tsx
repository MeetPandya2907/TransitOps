import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { FileText, Truck, Wrench, Route, Clock, Users, Percent } from 'lucide-react';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    activeVehicles: 0,
    availableVehicles: 0,
    vehiclesInMaintenance: 0,
    activeTrips: 0,
    pendingTrips: 0,
    driversOnDuty: 0,
    fleetUtilization: 0,
  });
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [vehicleStats, setVehicleStats] = useState({ available: 0, onTrip: 0, inShop: 0, retired: 0, total: 0 });

  // Filters
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch all base data
        const [vehiclesRes, tripsRes, driversRes] = await Promise.all([
          supabase.from('vehicles').select('*'),
          supabase.from('trips').select(`
            *,
            vehicles ( name_model, registration_number ),
            drivers ( name )
          `).order('created_at', { ascending: false }).limit(10),
          supabase.from('drivers').select('*')
        ]);

        let vehicles = vehiclesRes.data || [];
        const trips = tripsRes.data || [];
        const drivers = driversRes.data || [];

        // Apply Filters
        if (typeFilter !== 'All' && typeFilter !== 'Vehicle Type: All') {
          vehicles = vehicles.filter(v => v.type === typeFilter);
        }
        if (statusFilter !== 'All' && statusFilter !== 'Status: All') {
          const dbStatus = statusFilter.toLowerCase().replace(' ', '_');
          vehicles = vehicles.filter(v => v.status === dbStatus);
        }
        if (regionFilter !== 'All' && regionFilter !== 'Region: All') {
          vehicles = vehicles.filter(v => v.region === regionFilter);
        }

        // Calculate Vehicle Stats
        const vStats = { available: 0, onTrip: 0, inShop: 0, retired: 0, total: vehicles.length };
        vehicles.forEach(v => {
          if (v.status === 'available') vStats.available++;
          else if (v.status === 'on_trip') vStats.onTrip++;
          else if (v.status === 'in_shop') vStats.inShop++;
          else if (v.status === 'retired') vStats.retired++;
        });
        setVehicleStats(vStats);

        // Calculate Metrics
        const activeTripsCount = trips.filter(t => t.status === 'dispatched').length;
        const util = vehicles.length > 0 ? Math.round(((vStats.onTrip + vStats.inShop) / vehicles.length) * 100) : 0;

        setMetrics({
          activeVehicles: vStats.onTrip + vStats.inShop,
          availableVehicles: vStats.available,
          vehiclesInMaintenance: vStats.inShop,
          activeTrips: activeTripsCount,
          pendingTrips: trips.filter(t => t.status === 'draft').length,
          driversOnDuty: drivers.filter(d => d.status === 'on_trip').length,
          fleetUtilization: util,
        });

        setRecentTrips(trips);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [typeFilter, statusFilter, regionFilter]);

  if (loading) {
    return <div className="p-8 text-slate-400">Loading Dashboard Data...</div>;
  }

  return (
    <div className="flex flex-col space-y-6">
      
      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 items-center bg-[#151b2b] p-4 rounded-xl border border-white/5">
        <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest mr-2">Filters</span>
        <select 
          value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-[#1a1c23] border border-white/10 rounded-md px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-blue-500"
        >
          <option>Vehicle Type: All</option>
          <option>Van</option>
          <option>Truck</option>
        </select>
        <select 
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#1a1c23] border border-white/10 rounded-md px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-blue-500"
        >
          <option>Status: All</option>
          <option>Available</option>
          <option>On Trip</option>
        </select>
        <select 
          value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}
          className="bg-[#1a1c23] border border-white/10 rounded-md px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-blue-500"
        >
          <option>Region: All</option>
          <option>North</option>
          <option>South</option>
        </select>
      </div>

      {/* KPI Row - Excalidraw Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <KpiCard label="Active Vehicles" value={metrics.activeVehicles} accent="border-l-emerald-500" />
        <KpiCard label="Available Vehicles" value={metrics.availableVehicles} accent="border-l-blue-500" />
        <KpiCard label="Vehicles In Maintenance" value={metrics.vehiclesInMaintenance} accent="border-l-amber-500" />
        <KpiCard label="Active Trips" value={metrics.activeTrips} accent="border-l-blue-500" />
        <KpiCard label="Pending Trips" value={metrics.pendingTrips} accent="border-l-slate-400" />
        <KpiCard label="Drivers On Duty" value={metrics.driversOnDuty} accent="border-l-emerald-500" />
        <KpiCard label="Fleet Utilization" value={`${metrics.fleetUtilization}%`} accent="border-l-emerald-500" />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Trips Table (2/3 width) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#151b2b] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-white/5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Recent Trips</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-slate-500 bg-slate-50 dark:bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3 font-medium">Trip</th>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Driver</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Distance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {recentTrips.map(trip => (
                  <tr key={trip.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-300 font-medium">TRP-{trip.id.substring(0,6).toUpperCase()}</td>
                    <td className="px-4 py-3 text-slate-400">{trip.vehicles?.registration_number || '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{trip.drivers?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <TripStatusBadge status={trip.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-400">{trip.planned_distance} km</td>
                  </tr>
                ))}
                {recentTrips.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No recent trips found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Status Horizontal Bars (1/3 width) */}
        <div className="bg-white dark:bg-[#151b2b] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-white/5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Vehicle Status</h2>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center space-y-6">
            <StatusBar label="Available" count={vehicleStats.available} total={vehicleStats.total} color="bg-emerald-500" />
            <StatusBar label="On Trip" count={vehicleStats.onTrip} total={vehicleStats.total} color="bg-blue-500" />
            <StatusBar label="In Shop" count={vehicleStats.inShop} total={vehicleStats.total} color="bg-amber-500" />
            <StatusBar label="Retired" count={vehicleStats.retired} total={vehicleStats.total} color="bg-red-500" />
          </div>
        </div>

      </div>
    </div>
  );
}

function KpiCard({ label, value, accent }: { label: string, value: string | number, accent: string }) {
  return (
    <div className={cn("bg-[#151b2b] border border-white/5 rounded-lg p-4 flex flex-col justify-between border-l-4 shadow-sm", accent)}>
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 leading-tight">
        {label}
      </span>
      <span className="text-2xl font-bold text-slate-200">
        {value}
      </span>
    </div>
  );
}

function TripStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'draft': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    'dispatched': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'completed': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'cancelled': 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  
  return (
    <span className={cn(
      "px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border",
      styles[status] || styles.draft
    )}>
      {status}
    </span>
  );
}

function StatusBar({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-200 font-medium">{count}</span>
      </div>
      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-1000", color)} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

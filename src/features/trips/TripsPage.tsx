import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Plus, CheckCircle, XCircle, Play, Navigation, ArrowRight, X } from 'lucide-react';

type Trip = any;
type Vehicle = any;
type Driver = any;
type TripStatus = string;

export default function TripsPage() {
  const { profile } = useAuthStore();
  const role = profile?.roles?.[0] || 'Driver';
  const isDriver = role === 'Driver';
  const isManager = role === 'FleetManager';
  const canModify = isManager || isDriver;

  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTrip, setNewTrip] = useState({
    source: '',
    destination: '',
    vehicle_id: '',
    driver_id: '',
    cargo_weight: 0,
    planned_distance: 0,
    revenue: 0,
  });
  
  // Complete Modal state
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [activeTripToComplete, setActiveTripToComplete] = useState<Trip | null>(null);
  const [completionData, setCompletionData] = useState({
    actual_odometer_end: 0,
    fuel_consumed: 0,
    fuel_cost: 0,
    revenue: 0,
  });

  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchTripsAndAssets = async () => {
    setLoading(true);
    try {
      // Fetch all trips with vehicle & driver details joined
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('*, vehicles(*), drivers(*)')
        .order('created_at', { ascending: false });

      if (tripsError) throw tripsError;
      setTrips(tripsData || []);

      // Fetch active/available vehicles for scheduling dropdown
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*');

      if (vehiclesError) throw vehiclesError;
      setVehicles(vehiclesData || []);

      // Fetch active/available drivers for scheduling dropdown
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*');

      if (driversError) throw driversError;
      setDrivers(driversData || []);
    } catch (err: any) {
      console.error('Error fetching trips/assets:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripsAndAssets();
  }, []);

  const handleOpenAddModal = () => {
    setNewTrip({
      source: '',
      destination: '',
      vehicle_id: '',
      driver_id: '',
      cargo_weight: 0,
      planned_distance: 0,
      revenue: 0,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError(null);

    const selectedVehicle = vehicles.find(v => v.id === newTrip.vehicle_id);
    const selectedDriver = drivers.find(d => d.id === newTrip.driver_id);

    // Business Rules Verification
    if (!selectedVehicle) {
      setModalError('Please select a valid vehicle.');
      setSaving(false);
      return;
    }
    if (!selectedDriver) {
      setModalError('Please select a valid driver.');
      setSaving(false);
      return;
    }

    // 1. Retired or In Shop vehicle check
    if (selectedVehicle.status === 'retired' || selectedVehicle.status === 'in_shop') {
      setModalError(`Vehicle ${selectedVehicle.name_model} is in status "${selectedVehicle.status}" and cannot be scheduled.`);
      setSaving(false);
      return;
    }

    // 2. Driver license validity and suspended check
    const isExpired = new Date(selectedDriver.license_expiry_date) < new Date();
    if (selectedDriver.status === 'suspended' || isExpired) {
      setModalError(`Driver ${selectedDriver.name} has a Suspended status or an Expired driving license.`);
      setSaving(false);
      return;
    }

    // 3. Driver/Vehicle On Trip check
    if (selectedVehicle.status === 'on_trip') {
      setModalError(`Vehicle ${selectedVehicle.name_model} is already assigned to an active trip.`);
      setSaving(false);
      return;
    }
    if (selectedDriver.status === 'on_trip') {
      setModalError(`Driver ${selectedDriver.name} is already assigned to an active trip.`);
      setSaving(false);
      return;
    }

    // 4. Cargo Weight check
    if (Number(newTrip.cargo_weight) > Number(selectedVehicle.max_load_capacity)) {
      setModalError(`Cargo weight (${newTrip.cargo_weight} kg) exceeds vehicle's maximum load capacity (${selectedVehicle.max_load_capacity} kg).`);
      setSaving(false);
      return;
    }

    try {
      // Insert Draft Trip
      const { error } = await supabase
        .from('trips')
        .insert([{
          source: newTrip.source,
          destination: newTrip.destination,
          vehicle_id: newTrip.vehicle_id,
          driver_id: newTrip.driver_id,
          cargo_weight: Number(newTrip.cargo_weight),
          planned_distance: Number(newTrip.planned_distance),
          revenue: Number(newTrip.revenue),
          status: 'draft'
        }]);

      if (error) throw error;
      setIsModalOpen(false);
      fetchTripsAndAssets();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create trip schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDispatchTrip = async (trip: Trip) => {
    const selectedVehicle = vehicles.find(v => v.id === trip.vehicle_id);
    const selectedDriver = drivers.find(d => d.id === trip.driver_id);

    if (!selectedVehicle || !selectedDriver) return;

    if (selectedVehicle.status === 'on_trip' || selectedDriver.status === 'on_trip') {
      alert('Cannot dispatch: Vehicle or Driver is currently marked On Trip on another active delivery.');
      return;
    }
    if (selectedVehicle.status === 'in_shop' || selectedVehicle.status === 'retired') {
      alert('Cannot dispatch: Vehicle is In Shop or Retired.');
      return;
    }
    if (selectedDriver.status === 'suspended') {
      alert('Cannot dispatch: Driver is suspended.');
      return;
    }

    setLoading(true);
    try {
      // The DB trigger handle_trip_status_change will update vehicles and drivers automatically
      // Update trip -> dispatched
      const { error: tError } = await supabase
        .from('trips')
        .update({ 
          status: 'dispatched'
        })
        .eq('id', trip.id);
      if (tError) throw tError;

      fetchTripsAndAssets();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch trip');
      fetchTripsAndAssets();
    }
  };

  const handleOpenCompleteModal = (trip: Trip) => {
    setActiveTripToComplete(trip);
    setCompletionData({
      actual_odometer_end: Number(trip.vehicles?.odometer || 0) + Number(trip.planned_distance),
      fuel_consumed: 0,
      fuel_cost: 0,
      revenue: Number(trip.revenue),
    });
    setModalError(null);
    setIsCompleteModalOpen(true);
  };

  const handleCompleteTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTripToComplete) return;

    const vehicleOdometerStart = Number(activeTripToComplete.vehicles?.odometer || 0);

    if (Number(completionData.actual_odometer_end) < vehicleOdometerStart) {
      setModalError(`Ending odometer cannot be less than the starting odometer (${vehicleOdometerStart} km).`);
      return;
    }

    setSaving(true);
    setModalError(null);

    try {
      // 1. Update trip details (completed, final_odometer, fuel, final revenue)
      // The DB trigger handle_trip_status_change will automatically update vehicles and drivers
      const { error: tError } = await supabase
        .from('trips')
        .update({
          status: 'completed',
          final_odometer: Number(completionData.actual_odometer_end),
          fuel_consumed: Number(completionData.fuel_consumed),
          revenue: Number(completionData.revenue),
        })
        .eq('id', activeTripToComplete.id);
      if (tError) throw tError;

      // 4. Log fuel cost into Fuel Logs if fuel was logged
      if (Number(completionData.fuel_consumed) > 0) {
        const { error: fuelError } = await supabase
          .from('fuel_logs')
          .insert([{
            vehicle_id: activeTripToComplete.vehicle_id,
            trip_id: activeTripToComplete.id,
            liters: Number(completionData.fuel_consumed),
            cost: Number(completionData.fuel_cost),
            date: new Date().toISOString().split('T')[0]
          }]);
        if (fuelError) throw fuelError;

        // Log fuel expense
        const { error: expenseError } = await supabase
          .from('expenses')
          .insert([{
            vehicle_id: activeTripToComplete.vehicle_id,
            trip_id: activeTripToComplete.id,
            type: 'Fuel',
            amount: Number(completionData.fuel_cost),
            date: new Date().toISOString().split('T')[0],
            description: `Fuel consumption log for completed trip ${activeTripToComplete.source} to ${activeTripToComplete.destination}`
          }]);
        if (expenseError) throw expenseError;
      }

      setIsCompleteModalOpen(false);
      fetchTripsAndAssets();
    } catch (err: any) {
      setModalError(err.message || 'Failed to complete trip');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelTrip = async (trip: Trip) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled trip?')) return;
    
    setLoading(true);
    try {
      // If trip was already dispatched, we need to release driver and vehicle
      if (trip.status === 'Dispatched') {
    try {
      // The DB trigger handle_trip_status_change will update vehicles and drivers automatically
      // Update trip to cancelled
      const { error: tError } = await supabase
        .from('trips')
        .update({ status: 'cancelled' })
        .eq('id', trip.id);
      if (tError) throw tError;

      fetchTripsAndAssets();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel trip');
      fetchTripsAndAssets();
    }
  };

  const getTripStatusColor = (status: TripStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
      case 'dispatched':
        return 'bg-blue-100 text-blue-850 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/50';
      case 'completed':
        return 'bg-emerald-100 text-emerald-850 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/50';
      case 'cancelled':
        return 'bg-rose-100 text-rose-850 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/50';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const formatTripStatus = (status: string) => {
    const map: Record<string, string> = {
      'draft': 'Draft',
      'dispatched': 'Dispatched',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
    };
    };
    return map[status] || status;
  };

  const exportToCSV = () => {
    if (!trips || trips.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Trip ID,Source,Destination,Vehicle,Driver,Status,Planned Distance,Final Odometer,Fuel Consumed,Revenue"].join(",") + "\n"
      + trips.map((t: any) => 
          `"${t.id}","${t.source}","${t.destination}","${t.vehicles?.name_model}","${t.drivers?.profiles?.full_name}","${t.status}",${t.planned_distance},${t.final_odometer || ''},${t.fuel_consumed || ''},${t.revenue || ''}`
        ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "trips.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to find available vehicles for select form
  const availableVehiclesForForm = vehicles.filter(v => v.status === 'available');
  // Helper to find available drivers for select form
  const availableDriversForForm = drivers.filter(d => {
    const isExpired = new Date(d.license_expiry_date) < new Date();
    return d.status === 'available' && !isExpired;
  });

  return (
    <div className="space-y-6">
      
      {/* Top action header */}
      <div className="glass-panel rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-500">Fleet Operations</h4>
          <p className="text-xs text-slate-400 mt-0.5">Draft, dispatch, and close operational deliveries.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
          >
            Export CSV
          </button>
          {canModify && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/10 transition-all hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" />
              Plan Trip
            </button>
          )}
        </div>
      </div>

      {/* Trips list */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        </div>
      ) : trips.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center shadow-sm">
          <Navigation className="h-10 w-10 mx-auto text-slate-350 dark:text-slate-650 mb-3 animate-bounce" />
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Trips Scheduled</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">There are no operational deliveries planned yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {trips.map((t) => (
            <div key={t.id} className="glass-panel rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-slate-800/40 flex flex-col justify-between space-y-4">
              
              {/* Header card info */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    <span>{t.source}</span>
                    <ArrowRight className="h-4 w-4 text-brand-500" />
                    <span>{t.destination}</span>
                  </div>
                  <p className="text-xxs font-semibold text-slate-400">ID: {t.id.substring(0, 8)}</p>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xxs font-bold ${getTripStatusColor(t.status)}`}>
                  {formatTripStatus(t.status)}
                </span>
              </div>

              {/* Assignments / Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs border-y border-slate-100 dark:border-slate-800/60 py-3.5">
                <div>
                  <span className="text-slate-400 font-medium block">Vehicle Assigned:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{t.vehicles?.name_model || 'Unassigned'}</span>
                  <span className="text-xxs text-slate-400 block font-mono">Reg: {t.vehicles?.registration_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Driver Assigned:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{t.drivers?.name || 'Unassigned'}</span>
                  <span className="text-xxs text-slate-400 block">Lic: {t.drivers?.license_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Cargo Load:</span>
                  <span className="font-bold text-slate-750 dark:text-slate-300">{t.cargo_weight} kg</span>
                  <span className="text-xxs text-slate-400 block">Max Limit: {t.vehicles?.max_load_capacity} kg</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Est Distance & Rev:</span>
                  <span className="font-semibold text-slate-750 dark:text-slate-300">{t.planned_distance} km</span>
                  <span className="text-xxs text-brand-600 dark:text-brand-400 block font-bold">Planned Revenue: ${t.revenue}</span>
                </div>
              </div>

              {/* Completion Odometer details if completed */}
              {t.status === 'completed' && (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-xl p-3 text-xxs flex justify-between gap-4 text-slate-600 dark:text-emerald-400/80 font-medium">
                  <div>
                    <span className="text-slate-400">Final Odometer:</span>
                    <p className="font-bold">{t.final_odometer} km</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Fuel Logged:</span>
                    <p className="font-bold">{t.fuel_consumed} Liters</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Actual Revenue:</span>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">${t.revenue}</p>
                  </div>
                </div>
              )}

              {/* Operational Action Buttons */}
              {canModify && t.status !== 'completed' && t.status !== 'cancelled' && (
                <div className="flex justify-end gap-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/40">
                  <button
                    onClick={() => handleCancelTrip(t)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 dark:border-red-950/30 text-red-650 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Cancel Trip
                  </button>

                  {t.status === 'draft' && (
                    <button
                      onClick={() => handleDispatchTrip(t)}
                      className="flex items-center gap-1.5 px-4.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/10 transition-colors"
                    >
                      <Play className="h-3.5 w-3.5" /> Dispatch
                    </button>
                  )}

                  {t.status === 'dispatched' && (
                    <button
                      onClick={() => handleOpenCompleteModal(t)}
                      className="flex items-center gap-1.5 px-4.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-500/10 transition-colors"
                    >
                      <CheckCircle className="h-3.5 w-3.5" /> Complete Trip
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Plan Trip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="glass-panel w-full max-w-lg rounded-2xl shadow-2xl p-6 relative z-10 border border-white/20">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Trip Route & Dispatch</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleSaveTrip} className="mt-4 space-y-4">
              {modalError && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 text-xs text-red-655 dark:text-red-400 font-medium">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Source */}
                <div>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Source Depot</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chicago Hub"
                    value={newTrip.source}
                    onChange={(e) => setNewTrip({ ...newTrip, source: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Destination Depot</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Detroit Terminal"
                    value={newTrip.destination}
                    onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {/* Vehicle Selection */}
                <div>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Select Available Vehicle</label>
                  <select
                    required
                    value={newTrip.vehicle_id}
                    onChange={(e) => setNewTrip({ ...newTrip, vehicle_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="">-- Choose Asset --</option>
                    {availableVehiclesForForm.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.type}) - Max {v.max_load_capacity} kg
                      </option>
                    ))}
                  </select>
                  <span className="text-xxs text-slate-400 block mt-1">Only displaying available vehicles.</span>
                </div>

                {/* Driver Selection */}
                <div>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Select Available Driver</label>
                  <select
                    required
                    value={newTrip.driver_id}
                    onChange={(e) => setNewTrip({ ...newTrip, driver_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="">-- Choose Driver --</option>
                    {availableDriversForForm.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} (CDL) - Safety Score {d.safety_score}
                      </option>
                    ))}
                  </select>
                  <span className="text-xxs text-slate-400 block mt-1">Only displaying available & compliant drivers.</span>
                </div>

                {/* Cargo Weight */}
                <div>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Cargo Weight (kg)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newTrip.cargo_weight === 0 ? '' : newTrip.cargo_weight}
                    onChange={(e) => setNewTrip({ ...newTrip, cargo_weight: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {/* Distance */}
                <div>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Planned Distance (km)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newTrip.planned_distance === 0 ? '' : newTrip.planned_distance}
                    onChange={(e) => setNewTrip({ ...newTrip, planned_distance: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {/* Target Revenue */}
                <div className="col-span-2">
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Planned Cargo Revenue ($)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newTrip.revenue === 0 ? '' : newTrip.revenue}
                    onChange={(e) => setNewTrip({ ...newTrip, revenue: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/10 disabled:opacity-50"
                >
                  {saving ? 'Planning...' : 'Plan Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {isCompleteModalOpen && activeTripToComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCompleteModalOpen(false)}></div>
          <div className="glass-panel w-full max-w-lg rounded-2xl shadow-2xl p-6 relative z-10 border border-white/20">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Complete Operational Delivery</h3>
                <span className="text-xxs text-slate-400 mt-0.5">Route: {activeTripToComplete.source} to {activeTripToComplete.destination}</span>
              </div>
              <button onClick={() => setIsCompleteModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleCompleteTrip} className="mt-4 space-y-4">
              {modalError && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 text-xs text-red-655 dark:text-red-400 font-medium">
                  {modalError}
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 p-3 rounded-xl text-xs space-y-1 text-slate-650 dark:text-slate-400">
                <p><strong>Starting Odometer:</strong> {activeTripToComplete.vehicles?.odometer} km</p>
                <p><strong>Planned Route Distance:</strong> {activeTripToComplete.planned_distance} km</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Ending Odometer */}
                <div className="col-span-2">
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Ending Odometer Value (km)</label>
                  <input
                    type="number"
                    required
                    min={activeTripToComplete.vehicles?.odometer}
                    value={completionData.actual_odometer_end}
                    onChange={(e) => setCompletionData({ ...completionData, actual_odometer_end: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {/* Fuel Consumed */}
                <div>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Fuel Consumed (Liters)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    value={completionData.fuel_consumed === 0 ? '' : completionData.fuel_consumed}
                    onChange={(e) => setCompletionData({ ...completionData, fuel_consumed: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {/* Fuel Cost */}
                <div>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Total Fuel Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    value={completionData.fuel_cost === 0 ? '' : completionData.fuel_cost}
                    onChange={(e) => setCompletionData({ ...completionData, fuel_cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {/* Actual Revenue */}
                <div className="col-span-2">
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Actual Invoice Revenue Earned ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={completionData.revenue}
                    onChange={(e) => setCompletionData({ ...completionData, revenue: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/10 disabled:opacity-50"
                >
                  {saving ? 'Completing...' : 'Close & Log Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Plus, Search, Edit2, Trash2, X, Truck } from 'lucide-react';

type Vehicle = any;
type VehicleStatus = string;

export default function VehiclesPage() {
  const { profile } = useAuthStore();
  const role = profile?.roles?.[0] || 'Driver';
  const isManager = role === 'FleetManager';

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<Partial<Vehicle> | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicle_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (err: any) {
      console.error('Error fetching vehicles:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleOpenAddModal = () => {
    setCurrentVehicle({
      registration_number: '',
      name_model: '',
      type: 'Truck',
      max_load_capacity: 0,
      odometer: 0,
      acquisition_cost: 0,
      status: 'available',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vehicle: Vehicle) => {
    setCurrentVehicle(vehicle);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!window.confirm('Are you sure you want to retire/delete this vehicle from the fleet?')) return;
    
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchVehicles();
    } catch (err: any) {
      alert(err.message || 'Failed to delete vehicle');
    }
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVehicle) return;

    setSaving(true);
    setModalError(null);

    try {
      if (currentVehicle.id) {
        // Edit existing
        const { error } = await supabase
          .from('vehicles')
          .update({
            registration_number: currentVehicle.registration_number,
            name_model: currentVehicle.name_model,
            type: currentVehicle.type,
            max_load_capacity: Number(currentVehicle.max_load_capacity),
            odometer: Number(currentVehicle.odometer),
            acquisition_cost: Number(currentVehicle.acquisition_cost),
            status: (currentVehicle.status as VehicleStatus).toLowerCase(),
          })
          .eq('id', currentVehicle.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('vehicles')
          .insert([
            {
              registration_number: currentVehicle.registration_number,
              name_model: currentVehicle.name_model,
              type: currentVehicle.type,
              max_load_capacity: Number(currentVehicle.max_load_capacity),
              odometer: Number(currentVehicle.odometer),
              acquisition_cost: Number(currentVehicle.acquisition_cost),
              status: (currentVehicle.status as VehicleStatus).toLowerCase(),
            },
          ]);

        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err: any) {
      if (err.code === '23505') {
        setModalError('A vehicle with this Registration Number already exists.');
      } else {
        setModalError(err.message || 'Failed to save vehicle');
      }
    } finally {
      setSaving(false);
    }
  };

  // Filter vehicles on client side for responsive instant search
  const filteredVehicles = vehicles.filter((v) => {
    const nameModel = (v.name_model || '').toLowerCase();
    const regNum = (v.registration_number || '').toLowerCase();
    const matchesSearch = 
      regNum.includes(search.toLowerCase()) ||
      nameModel.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter.toLowerCase();
    const matchesType = typeFilter === 'All' || (v.type || '').toLowerCase() === typeFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40';
      case 'on_trip':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40';
      case 'in_shop':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40';
      case 'retired':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-400';
    }
  };

  const formatStatus = (status: string) => {
    const map: Record<string, string> = {
      'available': 'Available',
      'on_trip': 'On Trip',
      'in_shop': 'In Shop',
      'retired': 'Retired',
    };
    return map[status] || status;
  };

  return (
    <div className="space-y-6">
      
      {/* Filters Header */}
      <div className="glass-panel rounded-2xl p-5 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by name or registration #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-white"
            />
          </div>
          
          {/* Status filter */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/10"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </select>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/10"
            >
              <option value="All">All Types</option>
              <option value="Truck">Truck</option>
              <option value="Van">Van</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
            </select>
          </div>
        </div>

        {isManager && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/10 transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            Add Vehicle
          </button>
        )}
      </div>

      {/* Grid / Table list */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center shadow-sm">
          <Truck className="h-10 w-10 mx-auto text-slate-350 dark:text-slate-600 mb-3" />
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Vehicles Found</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try resetting your filters or search terms.</p>
        </div>
      ) : (
        /* Responsive View: Cards on mobile, Table on desktop */
        <div>
          {/* Card list for mobile (hidden on md) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredVehicles.map((v) => (
              <div key={v.id} className="glass-panel rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{v.name}</h4>
                    <span className="text-xs font-semibold text-slate-400 font-mono">{v.registration_number}</span>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xxs font-semibold leading-5 ${getStatusColor(v.status)}`}>
                    {v.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs border-y border-slate-100 dark:border-slate-800/60 py-3">
                  <div>
                    <span className="text-slate-400 font-medium">Type:</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-350">{v.type}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Load Limit:</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-350">{v.max_load_capacity} kg</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Odometer:</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-350">{Number(v.odometer).toLocaleString()} km</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Acquisition:</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-350">${Number(v.acquisition_cost).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Op Cost:</span>
                    <p className="font-semibold text-rose-600 dark:text-rose-400">${Number(v.operational_cost || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">ROI:</span>
                    <p className={`font-bold ${Number(v.roi) >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {(Number(v.roi || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {isManager && (
                  <div className="flex justify-end gap-2.5 pt-1">
                    <button
                      onClick={() => handleOpenEditModal(v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="h-3 w-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteVehicle(v.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 dark:border-red-950/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Table view for desktop (hidden on mobile) */}
          <div className="hidden md:block glass-panel rounded-2xl shadow-sm overflow-x-auto border border-slate-200/60 dark:border-slate-800/40">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800/80">
              <thead className="bg-slate-50/70 dark:bg-slate-900/30">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vehicle Model</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reg Number</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Max Capacity</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Odometer</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acq Cost</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Op Cost</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ROI</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  {isManager && <th className="relative px-6 py-3.5 text-right text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900/10 divide-y divide-slate-200/80 dark:divide-slate-800/50">
                {filteredVehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">{v.name_model}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">{v.registration_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-600 dark:text-slate-350">{v.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-600 dark:text-slate-350">{v.max_load_capacity} kg</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-600 dark:text-slate-350">{Number(v.odometer).toLocaleString()} km</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-600 dark:text-slate-350">${Number(v.acquisition_cost).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-rose-600 dark:text-rose-400">${Number(v.operational_cost || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold">
                      <span className={Number(v.roi) >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                        {(Number(v.roi || 0) * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xxs font-semibold leading-5 ${getStatusColor(v.status)}`}>
                        {formatStatus(v.status)}
                      </span>
                    </td>
                    {isManager && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium space-x-3">
                        <button
                          onClick={() => handleOpenEditModal(v)}
                          className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors"
                        >
                          <Edit2 className="h-4 w-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(v.id)}
                          className="text-red-500 hover:text-red-750 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRUD Modal for Manager */}
      {isModalOpen && currentVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="glass-panel w-full max-w-lg rounded-2xl shadow-2xl p-6 relative z-10 border border-slate-200 dark:border-white/20 bg-white dark:bg-[#151b2b]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {currentVehicle.id ? 'Modify Vehicle Details' : 'Register New Fleet Vehicle'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="mt-4 space-y-4">
              {modalError && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 text-xs text-red-600 dark:text-red-400 font-medium">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Model Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ford Transit Van-05"
                    value={currentVehicle.name_model || ''}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, name_model: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {/* Reg Number */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Registration Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. REG-552-3A"
                    value={currentVehicle.registration_number || ''}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, registration_number: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Vehicle Type</label>
                  <select
                    value={currentVehicle.type || 'Truck'}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, type: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="Truck">Truck</option>
                    <option value="Van">Van</option>
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Status</label>
                  <select
                    value={currentVehicle.status || 'available'}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, status: e.target.value as VehicleStatus })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="available">Available</option>
                    <option value="on_trip">On Trip</option>
                    <option value="in_shop">In Shop</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>

                {/* Load Capacity */}
                <div>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Max Load Capacity (kg)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={currentVehicle.max_load_capacity || ''}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, max_load_capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {/* Odometer */}
                <div>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Odometer (km)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={currentVehicle.odometer === undefined ? '' : currentVehicle.odometer}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, odometer: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {/* Acquisition Cost */}
                <div className="col-span-2">
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Acquisition Cost ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={currentVehicle.acquisition_cost === undefined ? '' : currentVehicle.acquisition_cost}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, acquisition_cost: Number(e.target.value) })}
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
                  {saving ? 'Saving...' : 'Save Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

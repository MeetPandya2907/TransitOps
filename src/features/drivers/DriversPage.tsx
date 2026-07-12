import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Plus, Search, Edit2, Trash2, ShieldAlert, Award, X, Users } from 'lucide-react';

// Use basic partial type if Database type isn't fully updated yet, or just any
type Driver = any;
type DriverStatus = string;

export default function DriversPage() {
  const { profile } = useAuthStore();
  const role = profile?.roles?.[0] || 'Driver';
  const isManager = role === 'FleetManager';
  const isOfficer = role === 'SafetyOfficer';
  const canModify = isManager || isOfficer;

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDriver, setCurrentDriver] = useState<Partial<Driver> | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrivers(data || []);
    } catch (err: any) {
      console.error('Error fetching drivers:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleOpenAddModal = () => {
    setCurrentDriver({
      name: '',
      license_number: '',
      license_category: 'Class A CDL',
      license_expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contact_number: '',
      safety_score: 100,
      status: 'available',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (driver: Driver) => {
    setCurrentDriver(driver);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleDeleteDriver = async (id: string) => {
    if (!isManager) {
      alert('Only Fleet Managers have permissions to delete driver records');
      return;
    }
    if (!window.confirm('Are you sure you want to remove this driver profile?')) return;
    
    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchDrivers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete driver');
    }
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDriver) return;

    // Client-side validations
    if (Number(currentDriver.safety_score) < 0 || Number(currentDriver.safety_score) > 100) {
      setModalError('Safety score must be between 0 and 100.');
      return;
    }

    setSaving(true);
    setModalError(null);

    try {
      if (currentDriver.id) {
        // Edit existing
        const { error } = await supabase
          .from('drivers')
          .update({
            name: currentDriver.name,
            license_number: currentDriver.license_number,
            license_category: currentDriver.license_category,
            license_expiry_date: currentDriver.license_expiry_date,
            contact_number: currentDriver.contact_number,
            safety_score: Number(currentDriver.safety_score),
            status: (currentDriver.status as DriverStatus).toLowerCase().replace(' ', '_'),
          })
          .eq('id', currentDriver.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('drivers')
          .insert([
            {
              name: currentDriver.name,
              license_number: currentDriver.license_number,
              license_category: currentDriver.license_category,
              license_expiry_date: currentDriver.license_expiry_date,
              contact_number: currentDriver.contact_number,
              safety_score: Number(currentDriver.safety_score),
              status: (currentDriver.status as DriverStatus).toLowerCase().replace(' ', '_'),
            },
          ]);

        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchDrivers();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save driver profile');
    } finally {
      setSaving(false);
    }
  };

  // Filter drivers on client side for responsive speed
  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch = 
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.license_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: DriverStatus) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40';
      case 'on_trip':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40';
      case 'off_duty':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800';
      case 'suspended':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-400';
    }
  };

  const formatDriverStatus = (status: string) => {
    const map: Record<string, string> = {
      'available': 'Available',
      'on_trip': 'On Trip',
      'off_duty': 'Off Duty',
      'suspended': 'Suspended',
    };
    return map[status] || status;
  };

  const getSafetyScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const isLicenseExpired = (expiryDateStr: string) => {
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    // Normalize date to compare day granularity
    expiry.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    return expiry < today;
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
              placeholder="Search by name or license number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-white"
            />
          </div>
          
          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/10"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="Off Duty">Off Duty</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        {canModify && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/10 transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            Add Driver
          </button>
        )}
      </div>

      {/* Grid / Table list */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center shadow-sm">
          <Users className="h-10 w-10 mx-auto text-slate-350 dark:text-slate-600 mb-3" />
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Drivers Found</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try resetting your filters or search terms.</p>
        </div>
      ) : (
        /* Responsive View: Cards on mobile, Table on desktop */
        <div>
          {/* Card list for mobile */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredDrivers.map((d) => {
              const expired = isLicenseExpired(d.license_expiry_date);
              return (
                <div key={d.id} className="glass-panel rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {d.name}
                        {expired && <span title="Expired License!"><ShieldAlert className="h-4 w-4 text-rose-500 animate-bounce" /></span>}
                      </h4>
                      <span className="text-xs font-semibold text-slate-400 font-mono">License: {d.license_number}</span>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xxs font-semibold leading-5 ${getStatusColor(d.status)}`}>
                      {d.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs border-y border-slate-100 dark:border-slate-800/60 py-3">
                    <div>
                      <span className="text-slate-400 font-medium">Class:</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-350">{d.license_category}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Expiry:</span>
                      <p className={`font-semibold ${expired ? 'text-rose-600 dark:text-rose-450 font-bold' : 'text-slate-700 dark:text-slate-350'}`}>
                        {d.license_expiry_date}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Contact:</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-350">{d.contact_number}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Safety Score:</span>
                      <p className={`font-bold flex items-center gap-1 ${getSafetyScoreColor(d.safety_score)}`}>
                        <Award className="h-3.5 w-3.5" />
                        {d.safety_score}/100
                      </p>
                    </div>
                  </div>

                  {canModify && (
                    <div className="flex justify-end gap-2.5 pt-1">
                      <button
                        onClick={() => handleOpenEditModal(d)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="h-3 w-3" /> Edit
                      </button>
                      {isManager && (
                        <button
                          onClick={() => handleDeleteDriver(d.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 dark:border-red-950/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Table view for desktop */}
          <div className="hidden md:block glass-panel rounded-2xl shadow-sm overflow-hidden border border-slate-200/60 dark:border-slate-800/40">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800/80">
              <thead className="bg-slate-50/70 dark:bg-slate-900/30">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Driver Name</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">License Number</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">License Expiry</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Safety Score</th>
                  <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  {canModify && <th className="relative px-6 py-3.5 text-right text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900/10 divide-y divide-slate-200/80 dark:divide-slate-800/50">
                {filteredDrivers.map((d) => {
                  const expired = isLicenseExpired(d.license_expiry_date);
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        {d.name}
                        {expired && <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 dark:bg-red-950 px-2 py-0.5 text-xxs font-bold text-red-650 dark:text-red-400 border border-red-200/60 dark:border-red-900/40">EXPIRED</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">{d.license_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-600 dark:text-slate-350">{d.license_category}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-xs font-semibold ${expired ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-350'}`}>
                        {d.license_expiry_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-600 dark:text-slate-350">{d.contact_number}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${getSafetyScoreColor(d.safety_score)}`}>
                        {d.safety_score}/100
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xxs font-semibold leading-5 ${getStatusColor(d.status)}`}>
                          {formatDriverStatus(d.status)}
                        </span>
                      </td>
                      {canModify && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium space-x-3">
                          <button
                            onClick={() => handleOpenEditModal(d)}
                            className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors"
                          >
                            <Edit2 className="h-4 w-4 inline" />
                          </button>
                          {isManager && (
                            <button
                              onClick={() => handleDeleteDriver(d.id)}
                              className="text-red-500 hover:text-red-750 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            >
                              <Trash2 className="h-4 w-4 inline" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRUD Modal */}
      {isModalOpen && currentDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="glass-panel w-full max-w-lg rounded-2xl shadow-2xl p-6 relative z-10 border border-white/20">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {currentDriver.id ? 'Modify Driver Record' : 'Register New Driver'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="mt-4 space-y-4">
              {modalError && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 text-xs text-red-600 dark:text-red-400 font-medium">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Driver Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Johnson"
                    value={currentDriver.name || ''}
                    onChange={(e) => setCurrentDriver({ ...currentDriver, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {/* License Number */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">License Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DL-294021A"
                    value={currentDriver.license_number || ''}
                    onChange={(e) => setCurrentDriver({ ...currentDriver, license_number: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {/* License Category */}
                <div>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">License Class</label>
                  <select
                    value={currentDriver.license_category || 'Class A CDL'}
                    onChange={(e) => setCurrentDriver({ ...currentDriver, license_category: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="Class A CDL">Class A CDL (Heavy Combinations)</option>
                    <option value="Class B CDL">Class B CDL (Heavy Single Vehicles)</option>
                    <option value="Class C CDL">Class C CDL (Light/Hazmat)</option>
                    <option value="Standard Class D">Standard Class D (Passenger Cars)</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Status</label>
                  <select
                    value={currentDriver.status || 'available'}
                    onChange={(e) => setCurrentDriver({ ...currentDriver, status: e.target.value as DriverStatus })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="available">Available</option>
                    <option value="on_trip">On Trip</option>
                    <option value="off_duty">Off Duty</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                {/* License Expiry Date */}
                <div>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">License Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={currentDriver.license_expiry_date || ''}
                    onChange={(e) => setCurrentDriver({ ...currentDriver, license_expiry_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Contact Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +1 (555) 019-2834"
                    value={currentDriver.contact_number || ''}
                    onChange={(e) => setCurrentDriver({ ...currentDriver, contact_number: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {/* Safety Score */}
                <div className="col-span-2">
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Safety Compliance Score (0 - 100)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={currentDriver.safety_score === undefined ? '' : currentDriver.safety_score}
                    onChange={(e) => setCurrentDriver({ ...currentDriver, safety_score: Number(e.target.value) })}
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
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

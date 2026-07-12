import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { MaintenanceLog, Vehicle } from '../types/database.types';
import { useAuth } from '../context/AuthContext';
import { Plus, CheckCircle, Wrench, Calendar, DollarSign, X } from 'lucide-react';

export const Maintenance: React.FC = () => {
  const { role } = useAuth();
  const isManager = role === 'Fleet Manager';

  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLog, setNewLog] = useState({
    vehicle_id: '',
    description: '',
    cost: 0,
    start_date: new Date().toISOString().split('T')[0],
  });

  // Close Modal State
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [activeLogToClose, setActiveLogToClose] = useState<MaintenanceLog | null>(null);
  const [closeData, setCloseData] = useState({
    end_date: new Date().toISOString().split('T')[0],
    final_cost: 0,
  });

  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchLogsAndVehicles = async () => {
    setLoading(true);
    try {
      const { data: logsData, error: logsError } = await supabase
        .from('maintenance_logs')
        .select('*, vehicles(*)')
        .order('start_date', { ascending: false });

      if (logsError) throw logsError;
      setLogs(logsData || []);

      // Fetch active vehicles for dropdown selection
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .neq('status', 'Retired');

      if (vehiclesError) throw vehiclesError;
      setVehicles(vehiclesData || []);
    } catch (err: any) {
      console.error('Error fetching maintenance logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsAndVehicles();
  }, []);

  const handleOpenAddModal = () => {
    setNewLog({
      vehicle_id: '',
      description: '',
      cost: 0,
      start_date: new Date().toISOString().split('T')[0],
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.vehicle_id) {
      setModalError('Please select a vehicle.');
      return;
    }

    setSaving(true);
    setModalError(null);

    try {
      // 1. Create Maintenance Log
      const { error: logError } = await supabase
        .from('maintenance_logs')
        .insert([{
          vehicle_id: newLog.vehicle_id,
          description: newLog.description,
          cost: Number(newLog.cost),
          start_date: newLog.start_date,
          status: 'Active'
        }]);

      if (logError) throw logError;

      // 2. Automatically change vehicle status to 'In Shop'
      const { error: vError } = await supabase
        .from('vehicles')
        .update({ status: 'In Shop' })
        .eq('id', newLog.vehicle_id);

      if (vError) throw vError;

      setIsModalOpen(false);
      fetchLogsAndVehicles();
    } catch (err: any) {
      setModalError(err.message || 'Failed to record maintenance event');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCloseModal = (log: MaintenanceLog) => {
    setActiveLogToClose(log);
    setCloseData({
      end_date: new Date().toISOString().split('T')[0],
      final_cost: Number(log.cost),
    });
    setModalError(null);
    setIsCloseModalOpen(true);
  };

  const handleCloseMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLogToClose) return;

    if (new Date(closeData.end_date) < new Date(activeLogToClose.start_date)) {
      setModalError(`Completion date cannot be before start date (${activeLogToClose.start_date}).`);
      return;
    }

    setSaving(true);
    setModalError(null);

    try {
      // 1. Update maintenance log status to Closed
      const { error: logError } = await supabase
        .from('maintenance_logs')
        .update({
          status: 'Closed',
          end_date: closeData.end_date,
          cost: Number(closeData.final_cost),
        })
        .eq('id', activeLogToClose.id);

      if (logError) throw logError;

      // 2. Automatically restore vehicle status to 'Available'
      const { error: vError } = await supabase
        .from('vehicles')
        .update({ status: 'Available' })
        .eq('id', activeLogToClose.vehicle_id);

      if (vError) throw vError;

      // 3. Log maintenance cost as a general fleet Expense
      const { error: expenseError } = await supabase
        .from('expenses')
        .insert([{
          vehicle_id: activeLogToClose.vehicle_id,
          type: 'Maintenance',
          cost: Number(closeData.final_cost),
          date: closeData.end_date,
          description: `Maintenance repair closed: ${activeLogToClose.description}`
        }]);

      if (expenseError) throw expenseError;

      setIsCloseModalOpen(false);
      fetchLogsAndVehicles();
    } catch (err: any) {
      setModalError(err.message || 'Failed to close maintenance event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top action header */}
      <div className="glass-panel rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-500">Fleet Maintenance Management</h4>
          <p className="text-xs text-slate-400 mt-0.5">Log inspection intervals and complete vehicle shop updates.</p>
        </div>
        {isManager && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/10 transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            Send to Shop
          </button>
        )}
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center shadow-sm">
          <Wrench className="h-10 w-10 mx-auto text-slate-350 dark:text-slate-650 mb-3" />
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Repairs Logged</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">There are no logged vehicle maintenance logs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {logs.map((l) => (
            <div key={l.id} className="glass-panel rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-slate-800/40 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{l.vehicles?.name || 'Unknown Vehicle'}</h4>
                  <span className="text-xs font-semibold text-slate-400 font-mono">Reg: {l.vehicles?.registration_number}</span>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xxs font-semibold leading-5 ${
                  l.status === 'Active'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/50'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-850 dark:text-slate-400'
                }`}>
                  {l.status === 'Active' ? 'In Shop' : 'Completed'}
                </span>
              </div>

              {/* Repair description */}
              <div className="text-xs space-y-2 text-slate-600 dark:text-slate-350">
                <p className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40 italic">
                  "{l.description}"
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>
                      <strong>In Shop:</strong> {l.start_date}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>
                      <strong>Out Shop:</strong> {l.end_date || 'Ongoing'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <DollarSign className="h-4 w-4 text-brand-500" />
                    <span className="text-sm font-bold text-slate-750 dark:text-white">
                      Logged Cost: ${Number(l.cost).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {isManager && l.status === 'Active' && (
                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/40">
                  <button
                    onClick={() => handleOpenCloseModal(l)}
                    className="flex items-center gap-1.5 px-4.5 py-1.5 bg-brand-605 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-500/10 transition-colors"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Complete Repair
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Send to Shop Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="glass-panel w-full max-w-lg rounded-2xl shadow-2xl p-6 relative z-10 border border-white/20">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Log Vehicle Inspection / Repair</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleSaveLog} className="mt-4 space-y-4">
              {modalError && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 text-xs text-red-655 dark:text-red-400 font-medium">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Select Shop Vehicle</label>
                <select
                  required
                  value={newLog.vehicle_id}
                  onChange={(e) => setNewLog({ ...newLog, vehicle_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.registration_number}) - {v.status}
                    </option>
                  ))}
                </select>
                <span className="text-xxs text-slate-400 block mt-1">This will change the vehicle status to "In Shop" automatically.</span>
              </div>

              <div>
                <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Repair / Maintenance Description</label>
                <textarea
                  required
                  placeholder="e.g. Engine tune-up and oil change due to scheduled 15,000 km check."
                  value={newLog.description}
                  onChange={(e) => setNewLog({ ...newLog, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Estimate Cost ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newLog.cost === 0 ? '' : newLog.cost}
                    onChange={(e) => setNewLog({ ...newLog, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newLog.start_date}
                    onChange={(e) => setNewLog({ ...newLog, start_date: e.target.value })}
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
                  {saving ? 'Saving...' : 'Send to Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Repair Modal */}
      {isCloseModalOpen && activeLogToClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCloseModalOpen(false)}></div>
          <div className="glass-panel w-full max-w-lg rounded-2xl shadow-2xl p-6 relative z-10 border border-white/20">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Complete Maintenance Repair</h3>
                <span className="text-xxs text-slate-400 mt-0.5">Asset: {activeLogToClose.vehicles?.name}</span>
              </div>
              <button onClick={() => setIsCloseModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleCloseMaintenance} className="mt-4 space-y-4">
              {modalError && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 text-xs text-red-655 dark:text-red-400 font-medium">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Final Cost */}
                <div className="col-span-2">
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Final Completed Cost ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={closeData.final_cost}
                    onChange={(e) => setCloseData({ ...closeData, final_cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {/* Completion Date */}
                <div className="col-span-2">
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Release Date</label>
                  <input
                    type="date"
                    required
                    value={closeData.end_date}
                    onChange={(e) => setCloseData({ ...closeData, end_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/10 disabled:opacity-50"
                >
                  {saving ? 'Closing...' : 'Close Repair & Release'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

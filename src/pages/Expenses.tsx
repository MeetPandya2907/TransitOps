import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Expense, Vehicle, Trip } from '../types/database.types';
import { useAuth } from '../context/AuthContext';
import { Plus, DollarSign, Search, Wrench, Fuel, Landmark as TollIcon, X } from 'lucide-react';

export const Expenses: React.FC = () => {
  const { role } = useAuth();
  const isManager = role === 'Fleet Manager';
  const isAnalyst = role === 'Financial Analyst';
  const isDriver = role === 'Driver';
  const canModify = isManager || isAnalyst || isDriver;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [vehicleFilter, setVehicleFilter] = useState('All');

  // Add Expense Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFuelLog, setIsFuelLog] = useState(false); // toggle fuel log specific form
  const [newExpense, setNewExpense] = useState({
    vehicle_id: '',
    trip_id: '',
    type: 'Toll',
    cost: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    // Fuel specific
    liters: 0,
  });

  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchExpensesAndAssets = async () => {
    setLoading(true);
    try {
      // Fetch general expenses
      const { data: expensesData, error: expError } = await supabase
        .from('expenses')
        .select('*, vehicles(*)')
        .order('date', { ascending: false });

      if (expError) throw expError;
      setExpenses(expensesData || []);

      // Fetch vehicles for dropdown
      const { data: vehiclesData, error: vError } = await supabase
        .from('vehicles')
        .select('*')
        .neq('status', 'Retired');

      if (vError) throw vError;
      setVehicles(vehiclesData || []);

      // Fetch recent trips to link expense optionally
      const { data: tripsData, error: tError } = await supabase
        .from('trips')
        .select('*, vehicles(*)')
        .order('created_at', { ascending: false });

      if (tError) throw tError;
      setTrips(tripsData || []);
    } catch (err: any) {
      console.error('Error fetching expenses/assets:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesAndAssets();
  }, []);

  const handleOpenAddModal = (fuelMode: boolean = false) => {
    setIsFuelLog(fuelMode);
    setNewExpense({
      vehicle_id: '',
      trip_id: '',
      type: fuelMode ? 'Fuel' : 'Toll',
      cost: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
      liters: 0,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.vehicle_id) {
      setModalError('Please select a vehicle.');
      return;
    }
    if (newExpense.cost <= 0) {
      setModalError('Expense cost must be greater than $0.');
      return;
    }

    setSaving(true);
    setModalError(null);

    try {
      if (isFuelLog) {
        if (newExpense.liters <= 0) {
          setModalError('Fuel volume (liters) must be greater than 0.');
          setSaving(false);
          return;
        }

        // 1. Insert into fuel_logs
        const { error: fuelError } = await supabase
          .from('fuel_logs')
          .insert([{
            vehicle_id: newExpense.vehicle_id,
            trip_id: newExpense.trip_id || null,
            liters: Number(newExpense.liters),
            cost: Number(newExpense.cost),
            date: newExpense.date,
          }]);

        if (fuelError) throw fuelError;

        // 2. Insert into expenses as type 'Fuel'
        const { error: expenseError } = await supabase
          .from('expenses')
          .insert([{
            vehicle_id: newExpense.vehicle_id,
            trip_id: newExpense.trip_id || null,
            type: 'Fuel',
            cost: Number(newExpense.cost),
            date: newExpense.date,
            description: `Fuel purchase: ${newExpense.liters} Liters. ${newExpense.description}`.trim(),
          }]);

        if (expenseError) throw expenseError;
      } else {
        // Insert general expense
        const { error: expenseError } = await supabase
          .from('expenses')
          .insert([{
            vehicle_id: newExpense.vehicle_id,
            trip_id: newExpense.trip_id || null,
            type: newExpense.type,
            cost: Number(newExpense.cost),
            date: newExpense.date,
            description: newExpense.description,
          }]);

        if (expenseError) throw expenseError;
      }

      setIsModalOpen(false);
      fetchExpensesAndAssets();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save expense log');
    } finally {
      setSaving(false);
    }
  };

  // Filter list locally
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch = e.description?.toLowerCase().includes(search.toLowerCase()) || 
      e.vehicles?.registration_number.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || e.type === typeFilter;
    const matchesVehicle = vehicleFilter === 'All' || e.vehicle_id === vehicleFilter;

    return matchesSearch && matchesType && matchesVehicle;
  });

  const getExpenseIcon = (type: string) => {
    switch (type) {
      case 'Fuel':
        return <Fuel className="h-4 w-4 text-orange-500" />;
      case 'Maintenance':
        return <Wrench className="h-4 w-4 text-blue-500" />;
      case 'Toll':
        return <TollIcon className="h-4 w-4 text-emerald-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-slate-500" />;
    }
  };

  // Compute stats
  const totalCost = filteredExpenses.reduce((acc, curr) => acc + Number(curr.cost), 0);
  const fuelCostTotal = filteredExpenses.filter(e => e.type === 'Fuel').reduce((acc, curr) => acc + Number(curr.cost), 0);
  const maintenanceCostTotal = filteredExpenses.filter(e => e.type === 'Maintenance').reduce((acc, curr) => acc + Number(curr.cost), 0);
  const tollCostTotal = filteredExpenses.filter(e => e.type === 'Toll').reduce((acc, curr) => acc + Number(curr.cost), 0);

  return (
    <div className="space-y-6">
      
      {/* KPI Cards section for expenses */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glass-panel rounded-2xl p-5 shadow-sm">
          <span className="text-xxs font-bold text-slate-400 uppercase tracking-wide">Total Expenses</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">${totalCost.toLocaleString()}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 shadow-sm">
          <span className="text-xxs font-bold text-slate-400 uppercase tracking-wide">Fuel Spend</span>
          <p className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-1">${fuelCostTotal.toLocaleString()}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 shadow-sm">
          <span className="text-xxs font-bold text-slate-400 uppercase tracking-wide">Maintenance Cost</span>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">${maintenanceCostTotal.toLocaleString()}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 shadow-sm">
          <span className="text-xxs font-bold text-slate-400 uppercase tracking-wide">Tolls & Other</span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">${(tollCostTotal + (totalCost - fuelCostTotal - maintenanceCostTotal - tollCostTotal)).toLocaleString()}</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="glass-panel rounded-2xl p-5 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search description or reg #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:border-slate-800 dark:bg-slate-900/40"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:text-white"
            >
              <option value="All">All Types</option>
              <option value="Fuel">Fuel</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Toll">Toll</option>
              <option value="Insurance">Insurance</option>
              <option value="Other">Other</option>
            </select>

            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:text-white"
            >
              <option value="All">All Vehicles</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.registration_number} - {v.name}</option>
              ))}
            </select>
          </div>
        </div>

        {canModify && (
          <div className="flex gap-2">
            <button
              onClick={() => handleOpenAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold transition-all hover:scale-[1.01]"
            >
              <Fuel className="h-4 w-4" /> Log Fuel
            </button>
            <button
              onClick={() => handleOpenAddModal(false)}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition-all hover:scale-[1.01]"
            >
              <Plus className="h-4 w-4" /> Log Expense
            </button>
          </div>
        )}
      </div>

      {/* Grid Expense List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center shadow-sm">
          <DollarSign className="h-10 w-10 mx-auto text-slate-350 dark:text-slate-655 mb-3" />
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Expenses Logged</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try expanding your search parameters.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl shadow-sm overflow-hidden border border-slate-200/60 dark:border-slate-800/40">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800/80">
            <thead className="bg-slate-50/70 dark:bg-slate-900/30">
              <tr>
                <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Asset Vehicle</th>
                <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Log Date</th>
                <th className="px-6 py-3.5 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900/10 divide-y divide-slate-200/80 dark:divide-slate-800/50">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">
                    {exp.vehicles?.name}
                    <span className="block text-xxs text-slate-450 dark:text-slate-400 font-mono">Reg: {exp.vehicles?.registration_number}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      {getExpenseIcon(exp.type)}
                      {exp.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-950 dark:text-white">${Number(exp.cost).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500 dark:text-slate-400">{exp.date}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-350 max-w-xs truncate">{exp.description || 'No description provided.'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Log Expense / Fuel Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="glass-panel w-full max-w-lg rounded-2xl shadow-2xl p-6 relative z-10 border border-white/20">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isFuelLog ? 'Log Fuel Addition' : 'Log General Operational Expense'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleSaveExpense} className="mt-4 space-y-4">
              {modalError && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 text-xs text-red-655 dark:text-red-400 font-medium">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Vehicle */}
                <div className="col-span-2">
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Select Fleet Vehicle</label>
                  <select
                    required
                    value={newExpense.vehicle_id}
                    onChange={(e) => setNewExpense({ ...newExpense, vehicle_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.registration_number})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional Trip Link */}
                <div className="col-span-2">
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Link to Active/Recent Trip (Optional)</label>
                  <select
                    value={newExpense.trip_id}
                    onChange={(e) => setNewExpense({ ...newExpense, trip_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="">-- Not Linked / General --</option>
                    {trips
                      .filter(t => !newExpense.vehicle_id || t.vehicle_id === newExpense.vehicle_id)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          Route: {t.source} ➔ {t.destination} ({t.status})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Type (only if not fuel mode) */}
                {!isFuelLog && (
                  <div>
                    <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Expense Type</label>
                    <select
                      value={newExpense.type}
                      onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="Toll">Toll</option>
                      <option value="Insurance">Insurance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                )}

                {/* Liters (only if fuel mode) */}
                {isFuelLog && (
                  <div>
                    <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Fuel Volume (Liters)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.1"
                      value={newExpense.liters === 0 ? '' : newExpense.liters}
                      onChange={(e) => setNewExpense({ ...newExpense, liters: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                )}

                {/* Cost */}
                <div className={isFuelLog ? '' : 'col-span-1'}>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Total Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    value={newExpense.cost === 0 ? '' : newExpense.cost}
                    onChange={(e) => setNewExpense({ ...newExpense, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {/* Date */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Transaction Date</label>
                  <input
                    type="date"
                    required
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Expense Description / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Highway tolls paid in Illinois."
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
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
                  {saving ? 'Logging...' : 'Log Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

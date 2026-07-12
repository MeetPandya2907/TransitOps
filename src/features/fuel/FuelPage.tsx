import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Fuel, TrendingUp, DollarSign, Droplet, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase as supabaseClient } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, subDays } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function FuelPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const exportToCSV = () => {
    if (!logs || logs.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Vehicle,Liters,Cost,Date"].join(",") + "\n"
      + logs.map((log: any) => 
          `"${log.vehicles?.name_model} (${log.vehicles?.registration_number})",${log.liters},${log.cost},${log.date}`
        ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "fuel_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (!logs || logs.length === 0) return;
    const doc = new jsPDF();
    doc.text("Fuel & Expense Logs", 14, 15);
    
    const tableData = logs.map((log: any) => [
      `${log.vehicles?.name_model || 'Unknown'} (${log.vehicles?.registration_number || 'N/A'})`,
      log.liters,
      `$${log.cost}`,
      log.date
    ]);

    autoTable(doc, {
      head: [['Vehicle', 'Liters Consumed', 'Cost', 'Date']],
      body: tableData,
      startY: 25,
    });
    
    doc.save('fuel_logs.pdf');
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [newFuel, setNewFuel] = useState({
    vehicle_id: '',
    liters: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      const { data } = await supabaseClient.from('vehicles').select('*');
      if (data) setVehicles(data);
    };
    fetchVehicles();
  }, []);

  const handleSaveFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFuel.vehicle_id) {
      setModalError('Please select a vehicle.');
      return;
    }
    setSaving(true);
    setModalError(null);

    try {
      const { error: fuelError } = await supabaseClient
        .from('fuel_logs')
        .insert([{
          vehicle_id: newFuel.vehicle_id,
          liters: Number(newFuel.liters),
          cost: Number(newFuel.cost),
          date: newFuel.date
        }]);

      if (fuelError) throw fuelError;

      const { error: expenseError } = await supabaseClient
        .from('expenses')
        .insert([{
          vehicle_id: newFuel.vehicle_id,
          type: 'Fuel',
          amount: Number(newFuel.cost),
          date: newFuel.date,
          description: 'Direct fuel log entry'
        }]);

      if (expenseError) throw expenseError;

      setIsModalOpen(false);
      setNewFuel({
        vehicle_id: '',
        liters: '',
        cost: '',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (err: any) {
      setModalError(err.message || 'Failed to save fuel log');
    } finally {
      setSaving(false);
    }
  };
  // const supabaseClient = createClient(); // use the client created by shadcn

  const fetchFuelLogs = async () => {
    const { data, error } = await supabaseClient
      .from('fuel_logs')
      .select(`
        *,
        vehicles (
          registration_number,
          name_model
        )
      `)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  };

  const { data: logs = [], isLoading, isError } = useQuery({
    queryKey: ['fuelLogs'],
    queryFn: fetchFuelLogs,
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabaseClient
      .channel('public:fuel_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fuel_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['fuelLogs'] });
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [supabaseClient, queryClient]);

  // Derived stats
  const totalCost = logs.reduce((sum: number, log: any) => sum + Number(log.cost || 0), 0);
  const totalLiters = logs.reduce((sum: number, log: any) => sum + Number(log.liters || 0), 0);
  const avgMpg = "24.5"; // Hardcoded MPG since we don't track distance in fuel_logs right now
  const refuelEvents = logs.length;

  const stats = [
    { name: 'Total Fuel Cost', stat: `$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { name: 'Liters Consumed', stat: totalLiters.toFixed(1).toString(), icon: Droplet, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { name: 'Avg MPG', stat: avgMpg, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { name: 'Refuel Events', stat: refuelEvents.toString(), icon: Fuel, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  ];

  // Prepare chart data for the last 7 days to preserve chronological order
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return {
      name: format(d, 'MMM dd'),
      key: format(d, 'yyyy-MM-dd'),
      cost: 0
    };
  });

  logs.forEach((log: any) => {
    if (log.date) {
      // Find if this log's date falls within our last 7 days
      const match = last7Days.find(d => d.key === log.date);
      if (match) {
        match.cost += Number(log.cost || 0);
      }
    }
  });

  const chartData = last7Days.map(d => ({ name: d.name, cost: d.cost }));

  const filteredLogs = logs.filter((log: any) => {
    const searchString = `${log.vehicles?.registration_number} ${log.vehicles?.name_model}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <p className="text-muted-foreground mt-1 text-sm">Monitor fuel consumption, expenses, and vehicle efficiency.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsModalOpen(true)}
             className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
             <Plus className="mr-2 h-4 w-4" />
             Log Fuel
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="overflow-hidden rounded-xl bg-card border border-border shadow-sm">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={cn("rounded-lg p-3", item.bg)}>
                     <item.icon className={cn("h-6 w-6", item.color)} aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-muted-foreground">{item.name}</dt>
                    <dd className="mt-1 text-2xl font-bold tracking-tight text-foreground">{item.stat}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Chart Section */}
      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden p-6 h-[400px]">
         <h3 className="text-base font-medium text-foreground mb-4">Fuel Expenses (Trend)</h3>
         <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--primary))' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Cost']}
              />
              <Area type="monotone" dataKey="cost" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
            </AreaChart>
          </ResponsiveContainer>
      </div>

      {/* Table Section */}
      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
         <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20">
            <div className="relative max-w-sm flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Search fuel logs..."
                className="block w-full rounded-lg border-0 py-2 pl-10 pr-3 text-foreground bg-background ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
              <button onClick={exportToCSV} className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors focus:outline-none">
                Export CSV
              </button>
              <button onClick={exportToPDF} className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors focus:outline-none">
                Export PDF
              </button>
              <button className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors focus:outline-none">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                Filters
              </button>
            </div>
         </div>
         <div className="overflow-x-auto">
            {isLoading ? (
               <div className="p-8 text-center text-muted-foreground">Loading fuel data...</div>
            ) : isError ? (
               <div className="p-8 text-center text-destructive">Failed to load data. Please check your connection.</div>
            ) : filteredLogs.length === 0 ? (
               <div className="p-8 text-center text-muted-foreground">No fuel logs found.</div>
            ) : (
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider sm:pl-6">Vehicle</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Liters</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cost ($)</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">
                        {log.vehicles?.name_model} <span className="text-muted-foreground block text-xs">({log.vehicles?.registration_number})</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground max-w-xs truncate">-</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground font-medium">{Number(log.liters).toFixed(1)}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground font-bold">${Number(log.cost).toLocaleString()}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                        {log.date ? format(parseISO(log.date), 'PP') : 'N/A'}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button className="text-primary hover:text-primary/80">View<span className="sr-only">, {log.id}</span></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
         </div>
      </div>

      {/* Log Fuel Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl p-6 relative z-10 border border-slate-200 dark:border-white/20 bg-white dark:bg-[#151b2b]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Log Fuel Entry
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFuel} className="mt-4 space-y-4">
              {modalError && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 text-xs text-red-600 dark:text-red-400 font-medium">
                  {modalError}
                </div>
              )}

              <div className="space-y-4">
                {/* Vehicle */}
                <div>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Vehicle</label>
                  <select
                    required
                    value={newFuel.vehicle_id}
                    onChange={(e) => setNewFuel({ ...newFuel, vehicle_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="">-- Select Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name_model} ({v.registration_number})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Liters and Cost */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Liters</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.1"
                      value={newFuel.liters}
                      onChange={(e) => setNewFuel({ ...newFuel, liters: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Cost ($)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={newFuel.cost}
                      onChange={(e) => setNewFuel({ ...newFuel, cost: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={newFuel.date}
                    onChange={(e) => setNewFuel({ ...newFuel, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md shadow-brand-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Fuel Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

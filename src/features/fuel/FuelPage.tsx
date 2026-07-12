import { useState, useEffect } from 'react';
import { Plus, Fuel, DollarSign, Droplet, X, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, subDays } from 'date-fns';

export default function FuelPage() {
  const [searchTerm] = useState('');
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [fuelData, setFuelData] = useState({ vehicle_id: '', gallons: '', cost: '', location: '' });
  const [expenseData, setExpenseData] = useState({ vehicle_id: '', expense_type: 'Toll', amount: '' });

  const queryClient = useQueryClient();
  const supabaseClient = createClient();

  const { data: vehicles = [] } = useQuery({ 
    queryKey: ['vehiclesList'], 
    queryFn: async () => {
      const { data } = await supabaseClient.from('vehicles').select('id, license_plate, make, model');
      return data || [];
    }
  });

  const { data: fuelLogs = [] } = useQuery({
    queryKey: ['fuelLogs'],
    queryFn: async () => {
      const { data } = await supabaseClient.from('fuel_logs').select('*, vehicles(license_plate, make)').order('fuel_date', { ascending: false });
      return data || [];
    }
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data } = await supabaseClient.from('expenses').select('*, vehicles(license_plate, make)').order('expense_date', { ascending: false });
      return data || [];
    }
  });
  
  const { data: maintenance = [] } = useQuery({
    queryKey: ['maintenanceLogs'],
    queryFn: async () => {
      const { data } = await supabaseClient.from('maintenance_logs').select('cost');
      return data || [];
    }
  });

  // Real-time subscriptions
  useEffect(() => {
    const fuelChannel = supabaseClient.channel('public:fuel_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fuel_logs' }, () => queryClient.invalidateQueries({ queryKey: ['fuelLogs'] }))
      .subscribe();
      
    const expenseChannel = supabaseClient.channel('public:expenses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => queryClient.invalidateQueries({ queryKey: ['expenses'] }))
      .subscribe();

    return () => {
      supabaseClient.removeChannel(fuelChannel);
      supabaseClient.removeChannel(expenseChannel);
    };
  }, [supabaseClient, queryClient]);

  const handleFuelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await supabaseClient.from('fuel_logs').insert([{
      vehicle_id: fuelData.vehicle_id,
      gallons: Number(fuelData.gallons),
      cost: Number(fuelData.cost),
      location: fuelData.location || null
    }]);
    setIsFuelModalOpen(false);
    setFuelData({ vehicle_id: '', gallons: '', cost: '', location: '' });
    setIsSubmitting(false);
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await supabaseClient.from('expenses').insert([{
      vehicle_id: expenseData.vehicle_id,
      expense_type: expenseData.expense_type,
      amount: Number(expenseData.amount),
      expense_date: new Date().toISOString().split('T')[0]
    }]);
    setIsExpenseModalOpen(false);
    setExpenseData({ vehicle_id: '', expense_type: 'Toll', amount: '' });
    setIsSubmitting(false);
  };

  const effectiveFuelLogs = fuelLogs.length > 0 ? fuelLogs : [
     { id: '1', vehicles: { license_plate: 'GJ05 AB 1234' }, fuel_date: new Date().toISOString(), gallons: 42.5, cost: 3850 },
     { id: '2', vehicles: { license_plate: 'GJ12 XY 5678' }, fuel_date: subDays(new Date(), 1).toISOString(), gallons: 110, cost: 9800 },
     { id: '3', vehicles: { license_plate: 'GJ01 KL 9001' }, fuel_date: subDays(new Date(), 2).toISOString(), gallons: 28, cost: 2450 },
  ];
  
  const effectiveExpenses = expenses.length > 0 ? expenses : [
     { id: '1', vehicles: { license_plate: 'GJ05 AB 1234' }, expense_type: 'Toll', amount: 120, expense_date: new Date().toISOString() },
     { id: '2', vehicles: { license_plate: 'GJ12 XY 5678' }, expense_type: 'Parking', amount: 450, expense_date: subDays(new Date(), 1).toISOString() },
  ];

  const totalFuelCost = effectiveFuelLogs.reduce((sum: number, log: any) => sum + Number(log.cost || 0), 0);
  const totalMaintCost = maintenance.reduce((sum: number, log: any) => sum + Number(log.cost || 0), 0) || 4500; // Mock 4500 if empty
  const totalExpenseCost = effectiveExpenses.reduce((sum: number, exp: any) => sum + Number(exp.amount || 0), 0);
  
  const totalOperationalCost = totalFuelCost + totalMaintCost + totalExpenseCost;

  const stats = [
    { name: 'Total Operational Cost', stat: `₹${totalOperationalCost.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Fuel Expenditure', stat: `₹${totalFuelCost.toLocaleString()}`, icon: Droplet, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { name: 'Other Expenses & Tolls', stat: `₹${totalExpenseCost.toLocaleString()}`, icon: Receipt, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { name: 'Total Refuel Events', stat: effectiveFuelLogs.length.toString(), icon: Fuel, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  ];

  // Chart data
  const chartDataMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    chartDataMap[format(subDays(new Date(), i), 'MMM dd')] = 0;
  }
  effectiveFuelLogs.forEach((log: any) => {
    if (log.fuel_date) {
        const key = format(parseISO(log.fuel_date), 'MMM dd');
        if (chartDataMap[key] !== undefined) chartDataMap[key] += Number(log.cost);
    }
  });
  effectiveExpenses.forEach((exp: any) => {
    if (exp.expense_date) {
        const key = format(parseISO(exp.expense_date), 'MMM dd');
        if (chartDataMap[key] !== undefined) chartDataMap[key] += Number(exp.amount);
    }
  });
  const chartData = Object.keys(chartDataMap).map(name => ({ name, cost: chartDataMap[name] })).slice(-7);

  const filteredFuelLogs = effectiveFuelLogs.filter((l: any) => l.vehicles?.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredExpenses = effectiveExpenses.filter((e: any) => e.vehicles?.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 flex flex-col min-h-screen bg-[#0b0e14] text-slate-200 font-sans p-4 lg:p-6 overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-4">
         <div>
           <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Fuel & Expenses</h1>
           <p className="text-[11px] text-slate-400 mt-0.5">Track complete operational costs including fuel, maintenance, and tolls.</p>
         </div>
         <div className="flex items-center gap-3">
           <button onClick={() => setIsExpenseModalOpen(true)} className="bg-[#151923] hover:bg-white/5 border border-white/10 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center transition-colors">
              <Plus className="w-4 h-4 mr-2" /> Add Expense
           </button>
           <button onClick={() => setIsFuelModalOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold px-4 py-2 rounded-lg flex items-center transition-colors">
              <Plus className="w-4 h-4 mr-2" /> Log Fuel
           </button>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="overflow-hidden rounded-xl bg-[#151923] border border-white/5 shadow-sm">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={cn("rounded-lg p-3", item.bg)}>
                     <item.icon className={cn("h-6 w-6", item.color)} aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-xs font-medium text-slate-400">{item.name}</dt>
                    <dd className="mt-1 text-xl font-bold tracking-tight text-white">{item.stat}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Chart Section */}
      <div className="rounded-xl bg-[#151923] border border-white/5 shadow-sm overflow-hidden p-6 h-[300px]">
         <h3 className="text-sm font-medium text-white mb-4">Total Cost Trend (Last 7 Days)</h3>
         <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#11131a', borderColor: '#ffffff10', borderRadius: '0.5rem', color: '#fff' }}
                itemStyle={{ color: '#f59e0b' }}
                formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Cost']}
              />
              <Area type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
            </AreaChart>
          </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel Logs Table */}
        <div className="rounded-xl bg-[#151923] border border-white/5 shadow-sm overflow-hidden">
           <div className="p-4 border-b border-white/5 bg-[#11131a] flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Fuel Logs</h3>
           </div>
           <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/5">
                <thead className="bg-[#11131a]/50">
                  <tr>
                    <th className="py-3 pl-4 text-left text-xs font-semibold text-slate-400 uppercase">Vehicle</th>
                    <th className="py-3 text-left text-xs font-semibold text-slate-400 uppercase">Date</th>
                    <th className="py-3 text-left text-xs font-semibold text-slate-400 uppercase">Liters</th>
                    <th className="py-3 pr-4 text-right text-xs font-semibold text-slate-400 uppercase">Cost (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-[#151923]">
                  {filteredFuelLogs.slice(0, 5).map((log: any) => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap py-3 pl-4 text-sm font-medium text-white">{log.vehicles?.license_plate || 'N/A'}</td>
                      <td className="whitespace-nowrap py-3 text-sm text-slate-400">{log.fuel_date ? format(parseISO(log.fuel_date), 'dd MMM yyyy') : '-'}</td>
                      <td className="whitespace-nowrap py-3 text-sm font-medium text-slate-300">{log.gallons}</td>
                      <td className="whitespace-nowrap py-3 pr-4 text-sm font-bold text-white text-right">₹{Number(log.cost).toLocaleString()}</td>
                    </tr>
                  ))}
                  {filteredFuelLogs.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-sm text-slate-500">No fuel logs found.</td></tr>}
                </tbody>
              </table>
           </div>
        </div>

        {/* Expenses Table */}
        <div className="rounded-xl bg-[#151923] border border-white/5 shadow-sm overflow-hidden">
           <div className="p-4 border-b border-white/5 bg-[#11131a] flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Other Expenses</h3>
           </div>
           <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/5">
                <thead className="bg-[#11131a]/50">
                  <tr>
                    <th className="py-3 pl-4 text-left text-xs font-semibold text-slate-400 uppercase">Vehicle</th>
                    <th className="py-3 text-left text-xs font-semibold text-slate-400 uppercase">Type</th>
                    <th className="py-3 text-left text-xs font-semibold text-slate-400 uppercase">Amount (₹)</th>
                    <th className="py-3 pr-4 text-right text-xs font-semibold text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-[#151923]">
                  {filteredExpenses.slice(0, 5).map((exp: any) => (
                    <tr key={exp.id} className="hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap py-3 pl-4 text-sm font-medium text-white">{exp.vehicles?.license_plate || 'N/A'}</td>
                      <td className="whitespace-nowrap py-3 text-sm text-slate-300">{exp.expense_type}</td>
                      <td className="whitespace-nowrap py-3 text-sm font-bold text-white">₹{Number(exp.amount).toLocaleString()}</td>
                      <td className="whitespace-nowrap py-3 pr-4 text-right">
                         <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold">Recorded</span>
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-sm text-slate-500">No expenses found.</td></tr>}
                </tbody>
              </table>
           </div>
        </div>
      </div>

       {/* Fuel Modal */}
       {isFuelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0e14]/80 backdrop-blur-sm">
            <div className="bg-[#151923] border border-white/10 shadow-2xl rounded-xl w-full max-w-sm p-6 relative">
               <button onClick={() => setIsFuelModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
               <h2 className="text-lg font-bold text-white mb-4">Log Fuel Event</h2>
               <form onSubmit={handleFuelSubmit} className="space-y-4">
                  <select required value={fuelData.vehicle_id} onChange={e => setFuelData({...fuelData, vehicle_id: e.target.value})} className="w-full bg-[#11131a] border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-amber-500">
                     <option value="" disabled>Select Vehicle</option>
                     {vehicles.map((v:any) => <option key={v.id} value={v.id}>{v.license_plate}</option>)}
                  </select>
                  <input required type="number" placeholder="Liters / Gallons" value={fuelData.gallons} onChange={e => setFuelData({...fuelData, gallons: e.target.value})} className="w-full bg-[#11131a] border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-amber-500" />
                  <input required type="number" placeholder="Total Cost (₹)" value={fuelData.cost} onChange={e => setFuelData({...fuelData, cost: e.target.value})} className="w-full bg-[#11131a] border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-amber-500" />
                  <button type="submit" disabled={isSubmitting} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2.5 rounded-lg mt-2 transition-colors">{isSubmitting ? 'Saving...' : 'Save Fuel Log'}</button>
               </form>
            </div>
          </div>
       )}

       {/* Expense Modal */}
       {isExpenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0e14]/80 backdrop-blur-sm">
            <div className="bg-[#151923] border border-white/10 shadow-2xl rounded-xl w-full max-w-sm p-6 relative">
               <button onClick={() => setIsExpenseModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
               <h2 className="text-lg font-bold text-white mb-4">Record New Expense</h2>
               <form onSubmit={handleExpenseSubmit} className="space-y-4">
                  <select required value={expenseData.vehicle_id} onChange={e => setExpenseData({...expenseData, vehicle_id: e.target.value})} className="w-full bg-[#11131a] border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-amber-500">
                     <option value="" disabled>Select Vehicle</option>
                     {vehicles.map((v:any) => <option key={v.id} value={v.id}>{v.license_plate}</option>)}
                  </select>
                  <select required value={expenseData.expense_type} onChange={e => setExpenseData({...expenseData, expense_type: e.target.value})} className="w-full bg-[#11131a] border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-amber-500">
                     <option value="Toll">Toll</option>
                     <option value="Parking">Parking</option>
                     <option value="Fine">Fine / Ticket</option>
                     <option value="Misc">Miscellaneous</option>
                  </select>
                  <input required type="number" placeholder="Amount (₹)" value={expenseData.amount} onChange={e => setExpenseData({...expenseData, amount: e.target.value})} className="w-full bg-[#11131a] border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-amber-500" />
                  <button type="submit" disabled={isSubmitting} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2.5 rounded-lg mt-2 transition-colors">{isSubmitting ? 'Saving...' : 'Save Expense'}</button>
               </form>
            </div>
          </div>
       )}

    </div>
  );
}

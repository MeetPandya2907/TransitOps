import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Fuel, TrendingUp, DollarSign, Droplet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, subDays } from 'date-fns';

export default function FuelPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const supabaseClient = createClient(); // use the client created by shadcn

  const fetchFuelLogs = async () => {
    const { data, error } = await supabaseClient
      .from('fuel_logs')
      .select(`
        *,
        vehicles (
          license_plate,
          make,
          model
        ),
        drivers (
          user_id
        )
      `)
      .order('fuel_date', { ascending: false });

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
  const totalGallons = logs.reduce((sum: number, log: any) => sum + Number(log.gallons || 0), 0);
  const avgMpg = "24.5"; // Hardcoded MPG since we don't track distance in fuel_logs right now
  const refuelEvents = logs.length;

  const stats = [
    { name: 'Total Fuel Cost', stat: `₹${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { name: 'Liters/Gallons Consumed', stat: totalGallons.toFixed(1).toString(), icon: Droplet, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { name: 'Avg MPG', stat: avgMpg, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { name: 'Refuel Events', stat: refuelEvents.toString(), icon: Fuel, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  ];

  // Prepare chart data (group by date)
  const chartDataMap: Record<string, number> = {};
  
  // Initialize last 7 days with 0
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i);
    chartDataMap[format(d, 'MMM dd')] = 0;
  }

  logs.forEach((log: any) => {
    if (log.fuel_date) {
        const dateKey = format(parseISO(log.fuel_date), 'MMM dd');
        if (chartDataMap[dateKey] !== undefined) {
            chartDataMap[dateKey] += Number(log.cost);
        } else {
            // For older dates outside 7 days
            if (!chartDataMap[dateKey]) chartDataMap[dateKey] = 0;
            chartDataMap[dateKey] += Number(log.cost);
        }
    }
  });

  const chartData = Object.keys(chartDataMap).map(key => ({
    name: key,
    cost: chartDataMap[key]
  })).slice(-7); // take last 7 to avoid clutter

  const filteredLogs = logs.filter((log: any) => {
    const searchString = `${log.vehicles?.license_plate} ${log.location}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <p className="text-muted-foreground mt-1 text-sm">Monitor fuel consumption, expenses, and vehicle efficiency.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
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
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '0.5rem', color: 'var(--foreground)' }}
                itemStyle={{ color: 'var(--primary)' }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Cost']}
              />
              <Area type="monotone" dataKey="cost" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
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
            <button className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors focus:outline-none">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              Filters
            </button>
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
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gallons</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cost (₹)</th>
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
                        {log.vehicles?.make} {log.vehicles?.model} <span className="text-muted-foreground block text-xs">({log.vehicles?.license_plate})</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground max-w-xs truncate">{log.location || 'N/A'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground font-medium">{Number(log.gallons).toFixed(1)}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground font-bold">₹{Number(log.cost).toLocaleString()}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                        {log.fuel_date ? format(parseISO(log.fuel_date), 'PP p') : 'N/A'}
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
    </div>
  );
}

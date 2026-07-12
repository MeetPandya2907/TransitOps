import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useSupabaseQuery } from "@/lib/useSupabaseQuery";
import { financialData as fallbackData } from "@/lib/analyticsData";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function FinancialReport() {
  const { data: fuelLogs = [], isLoading: loadingFuel } = useSupabaseQuery<any>('fuel_logs', []);
  const { data: workOrders = [], isLoading: loadingMaintenance } = useSupabaseQuery<any>('work_orders', []);
  const { data: trips = [], isLoading: loadingTrips } = useSupabaseQuery<any>('trips', []);

  const isLoading = loadingFuel || loadingMaintenance || loadingTrips;

  const { chartData, totalRevenue, totalFuel, totalMaintenance } = useMemo(() => {
    if (isLoading) return { chartData: [], totalRevenue: 0, totalFuel: 0, totalMaintenance: 0 };

    let totalRev = 0;
    let totalF = 0;
    let totalM = 0;

    const monthlyData: Record<string, { month: string; revenue: number; fuelCost: number; maintenanceCost: number }> = {};

    const getMonthKey = (dateString: string) => {
      if (!dateString) return 'Unknown';
      const d = new Date(dateString);
      return d.toLocaleString('default', { month: 'short' }); // e.g. "Jan"
    };

    const initializeMonth = (month: string) => {
      if (!monthlyData[month]) {
        monthlyData[month] = { month, revenue: 0, fuelCost: 0, maintenanceCost: 0 };
      }
    };

    // Calculate Fuel Costs
    fuelLogs.forEach(log => {
      const month = getMonthKey(log.date || log.created_at);
      initializeMonth(month);
      const cost = Number(log.cost) || 0;
      monthlyData[month].fuelCost += cost;
      totalF += cost;
    });

    // Calculate Maintenance Costs
    workOrders.forEach(wo => {
      if (wo.status !== 'completed' && wo.status !== 'pending') return; // include pending to show upcoming? Let's just include all for now or check if cost exists
      const month = getMonthKey(wo.completed_date || wo.scheduled_date || wo.created_at);
      initializeMonth(month);
      const cost = Number(wo.cost) || 0;
      monthlyData[month].maintenanceCost += cost;
      totalM += cost;
    });

    // Calculate Revenue (Distance * ₹500 as an example calculation, or if revenue column exists)
    trips.forEach(trip => {
      if (trip.status === 'Completed' || trip.status === 'completed') {
        const month = getMonthKey(trip.end_time || trip.created_at);
        initializeMonth(month);
        const revenue = Number(trip.revenue) || (Number(trip.distance || 0) * 500); // fallback to distance based
        monthlyData[month].revenue += revenue;
        totalRev += revenue;
      }
    });

    const orderedMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let processedChartData = Object.values(monthlyData).sort((a, b) => orderedMonths.indexOf(a.month) - orderedMonths.indexOf(b.month));

    // Fallback to static data if database is empty
    if (processedChartData.length === 0) {
      processedChartData = fallbackData;
      totalRev = fallbackData.reduce((acc, curr) => acc + curr.revenue, 0);
      totalF = fallbackData.reduce((acc, curr) => acc + curr.fuelCost, 0);
      totalM = fallbackData.reduce((acc, curr) => acc + curr.maintenanceCost, 0);
    }

    return {
      chartData: processedChartData,
      totalRevenue: totalRev,
      totalFuel: totalF,
      totalMaintenance: totalM
    };
  }, [fuelLogs, workOrders, trips, isLoading]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Revenue vs Costs</CardTitle>
          <CardDescription>Monthly breakdown of gross revenue against major expenses.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-end gap-2 pb-4">
              <Skeleton className="h-4/5 w-full rounded-md" />
              <div className="flex gap-4 w-full">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.2} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip cursor={{fill: 'hsl(var(--muted)/0.5)'}} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fuelCost" name="Fuel Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="maintenanceCost" name="Maintenance" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-sm bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Financial Summary (YTD)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-primary/10 pb-4">
              <span className="text-muted-foreground font-medium">Total Gross Revenue</span>
              {isLoading ? <Skeleton className="h-8 w-32" /> : (
                <span className="text-2xl font-bold text-foreground">₹{totalRevenue.toLocaleString()}</span>
              )}
            </div>
            <div className="flex justify-between items-center border-b border-primary/10 pb-4">
              <span className="text-muted-foreground font-medium">Total Fuel Expenses</span>
              {isLoading ? <Skeleton className="h-8 w-32" /> : (
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-500">₹{totalFuel.toLocaleString()}</span>
              )}
            </div>
            <div className="flex justify-between items-center pb-2">
              <span className="text-muted-foreground font-medium">Total Maintenance</span>
              {isLoading ? <Skeleton className="h-8 w-32" /> : (
                <span className="text-2xl font-bold text-destructive">₹{totalMaintenance.toLocaleString()}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

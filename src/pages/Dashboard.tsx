import { 
  Truck, CheckCircle2, Droplets, Wrench, Users, DollarSign, 
  Plus, AlertTriangle, ArrowUpRight, ArrowDownRight, MapPin,
  FileText, Activity, ShieldAlert, Zap, Flame, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend
} from 'recharts';

// --- MOCK DATA ---
const revenueData = [
  { name: 'Jan', Revenue: 18, Expenses: 12, Profit: 6 },
  { name: 'Feb', Revenue: 22, Expenses: 14, Profit: 8 },
  { name: 'Mar', Revenue: 20, Expenses: 15, Profit: 5 },
  { name: 'Apr', Revenue: 28, Expenses: 18, Profit: 10 },
  { name: 'May', Revenue: 25, Expenses: 16, Profit: 9 },
  { name: 'Jun', Revenue: 32, Expenses: 19, Profit: 13 },
];

const fuelData = [
  { name: '1 May', used: 1200, cost: 24000 },
  { name: '6 May', used: 1100, cost: 22000 },
  { name: '11 May', used: 1500, cost: 30000 },
  { name: '16 May', used: 1350, cost: 27000 },
  { name: '21 May', used: 1400, cost: 28000 },
  { name: '26 May', used: 1250, cost: 25000 },
];

const maintenanceData = [
  { name: 'Jan', Upcoming: 10, Completed: 8, Overdue: 2 },
  { name: 'Feb', Upcoming: 15, Completed: 12, Overdue: 3 },
  { name: 'Mar', Upcoming: 12, Completed: 10, Overdue: 4 },
  { name: 'Apr', Upcoming: 18, Completed: 15, Overdue: 2 },
  { name: 'May', Upcoming: 20, Completed: 18, Overdue: 5 },
  { name: 'Jun', Upcoming: 25, Completed: 22, Overdue: 1 },
];

const vehicleStatusData = [
  { name: 'Running', value: 138, color: '#10b981' },
  { name: 'Idle', value: 6, color: '#3b82f6' },
  { name: 'Maintenance', value: 3, color: '#f59e0b' },
  { name: 'Offline', value: 2, color: '#64748b' },
  { name: 'Out of Service', value: 1, color: '#ef4444' },
];

const alerts = [
  { id: 1, title: 'Over Speed Alert', desc: 'Vehicle GJ05 AB 1234 exceeded speed limit', time: '2 min ago', type: 'critical' },
  { id: 2, title: 'Engine Temperature High', desc: 'Vehicle GJ12 XY 5678 temperature high', time: '10 min ago', type: 'warning' },
  { id: 3, title: 'Insurance Expiring', desc: 'Vehicle GJ01 KL 9001 insurance expiring in 5 days', time: '30 min ago', type: 'warning' },
  { id: 4, title: 'Maintenance Overdue', desc: 'Vehicle GJ05 MN 3456 maintenance overdue', time: '1 hour ago', type: 'critical' },
  { id: 5, title: 'Trip Completed', desc: 'Trip Surat to Ahmedabad completed', time: '2 hours ago', type: 'success' },
];

const driverPerformance = [
  { rank: 1, driver: 'Rahul Sharma', trips: 58, fuelScore: 96, safetyScore: 94, rating: 4.9 },
  { rank: 2, driver: 'Vijay Patel', trips: 45, fuelScore: 92, safetyScore: 91, rating: 4.7 },
  { rank: 3, driver: 'Amit Kumar', trips: 40, fuelScore: 90, safetyScore: 88, rating: 4.6 },
  { rank: 4, driver: 'Suresh Yadav', trips: 38, fuelScore: 88, safetyScore: 85, rating: 4.5 },
];

const recentTrips = [
  { vehicle: 'GJ05 AB 1234', driver: 'Rahul Sharma', start: '28 May, 08:00', dest: 'Ahmedabad', status: 'Completed' },
  { vehicle: 'GJ12 XY 5678', driver: 'Vijay Patel', start: '28 May, 07:30', dest: 'Vadodara', status: 'Completed' },
  { vehicle: 'GJ01 KL 9001', driver: 'Amit Kumar', start: '28 May, 07:15', dest: 'Rajkot', status: 'In Progress' },
  { vehicle: 'GJ05 MN 3456', driver: 'Suresh Yadav', start: '28 May, 06:45', dest: 'Bhavnagar', status: 'In Progress' },
];

import { AnimatedCounter } from "@/components/ui/animated-counter";
import { PageHeader } from "@/components/ui/page-header";

export default function Dashboard() {
  return (
    <div className="flex-1 space-y-4 max-w-[1920px] mx-auto pb-10">
      
      <PageHeader 
        title="Executive Dashboard" 
        description="Real-time overview of your fleet operations"
        actions={
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-9">
            <Plus className="mr-2 h-4 w-4" />
            Quick Action
          </Button>
        }
      />
      
      <div className="px-4 sm:px-6 lg:px-8 space-y-4">


      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Total Fleet" value={<AnimatedCounter value={150} />} subtitle="Vehicles" trend="+8%" trendText="vs last month" icon={<Truck className="text-blue-500" />} />
        <KpiCard title="Active Vehicles" value={<AnimatedCounter value={138} />} subtitle="Running" trend="92%" trendText="Utilization" trendUp icon={<CheckCircle2 className="text-emerald-500" />} />
        <KpiCard title="Fuel Cost (MTD)" value={<><span className="text-sm">₹</span><AnimatedCounter value={245900} formatFn={(v) => (v/100000).toFixed(2) + 'L'} /></>} subtitle="" trend="-7%" trendText="vs last month" trendUp icon={<Droplets className="text-amber-500" />} />
        <KpiCard title="Maintenance Due" value={<AnimatedCounter value={18} />} subtitle="Vehicles" trend="6" trendText="Critical" trendUp={false} icon={<Wrench className="text-purple-500" />} />
        <KpiCard title="Active Drivers" value={<AnimatedCounter value={132} />} subtitle="Drivers" trend="98%" trendText="Attendance" trendUp icon={<Users className="text-sky-500" />} />
        <KpiCard title="Revenue (MTD)" value={<><span className="text-sm">₹</span><AnimatedCounter value={1840000} formatFn={(v) => (v/100000).toFixed(1) + ' Lakh'} /></>} subtitle="" trend="+12%" trendText="vs last month" trendUp icon={<DollarSign className="text-emerald-500" />} />
      </div>

      {/* Main Grid: 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        
        {/* Row 1: Fleet Health (1 col), Map (2 col), Alerts (1 col) */}
        <Card className="col-span-1 xl:col-span-1 border-muted/50 shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Fleet Health Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            {/* Custom SVG Semi-Circle Gauge */}
            <div className="relative w-48 h-24 mt-4 overflow-hidden">
              <svg viewBox="0 0 100 50" className="w-full h-full">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeWidth="12" className="text-muted/50" strokeLinecap="round" />
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeWidth="12" className="text-emerald-500" strokeDasharray="125.6" strokeDashoffset="5" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                <span className="text-4xl font-bold tracking-tighter">96%</span>
                <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mt-1">Excellent</span>
              </div>
            </div>
            <div className="flex justify-between w-full mt-8 pt-4 border-t px-2">
              <div className="flex flex-col items-center"><span className="text-lg font-bold text-destructive">2</span><span className="text-[10px] text-muted-foreground uppercase">Critical</span></div>
              <div className="w-px bg-border h-8"></div>
              <div className="flex flex-col items-center"><span className="text-lg font-bold text-amber-500">5</span><span className="text-[10px] text-muted-foreground uppercase">Warning</span></div>
              <div className="w-px bg-border h-8"></div>
              <div className="flex flex-col items-center"><span className="text-lg font-bold text-emerald-500">143</span><span className="text-[10px] text-muted-foreground uppercase">Healthy</span></div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2 xl:col-span-2 border-muted/50 shadow-sm overflow-hidden bg-card relative min-h-[300px]">
          <CardHeader className="absolute top-0 left-0 z-10 w-full bg-gradient-to-b from-card/90 to-transparent pb-8">
            <CardTitle className="text-sm font-semibold">Live Fleet Map</CardTitle>
          </CardHeader>
          <div className="absolute inset-0 bg-[#0f172a]/90 dark:bg-[#0f172a]">
             {/* Abstract Map Background Grid/Lines */}
             <div className="w-full h-full opacity-20" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
             {/* SVG Routes */}
             <svg className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' }}>
               <path d="M 150 200 C 250 150, 350 250, 450 100" fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeDasharray="8 8" />
               <path d="M 300 280 C 400 250, 450 150, 550 180" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 6" />
             </svg>
             {/* Map Pins */}
             <div className="absolute top-[90px] left-[430px] flex flex-col items-center -translate-x-1/2 -translate-y-full">
               <div className="bg-card border border-border shadow-xl rounded-md p-2 w-48 text-xs mb-2 relative z-20">
                 <div className="flex items-center justify-between mb-1">
                   <span className="font-bold">GJ05 AB 1234</span>
                   <span className="bg-emerald-500/20 text-emerald-500 px-1.5 rounded text-[10px] font-bold">Running</span>
                 </div>
                 <div className="text-muted-foreground text-[10px] mb-2">Rahul Sharma</div>
                 <div className="flex justify-between text-[10px]">
                   <span className="flex items-center gap-1"><Zap size={10} className="text-amber-500" /> 65 km/h</span>
                   <span>ETA: 11:30 AM</span>
                 </div>
               </div>
               <div className="h-6 w-6 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900 shadow-lg flex items-center justify-center text-white relative z-10 animate-pulse">
                 <Truck size={12} />
               </div>
             </div>
             
             <div className="absolute top-[180px] left-[540px] h-5 w-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-white">
               <Truck size={10} />
             </div>
             <div className="absolute top-[270px] left-[290px] h-5 w-5 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-white">
               <AlertTriangle size={10} />
             </div>
          </div>
        </Card>

        <Card className="col-span-1 xl:col-span-1 border-muted/50 shadow-sm bg-card flex flex-col">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Alerts & Notifications</CardTitle>
            <span className="text-xs text-blue-500 hover:underline cursor-pointer">View All</span>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-4">
              {alerts.map(alert => (
                <div key={alert.id} className="flex gap-3">
                  <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                    alert.type === 'critical' ? 'bg-destructive/10 text-destructive' :
                    alert.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {alert.type === 'critical' ? <ShieldAlert size={12} /> : 
                     alert.type === 'warning' ? <AlertTriangle size={12} /> : 
                     <CheckCircle2 size={12} />}
                  </div>
                  <div className="flex flex-col w-full">
                    <div className="flex justify-between items-start w-full">
                      <span className={`text-xs font-bold ${
                        alert.type === 'critical' ? 'text-destructive' :
                        alert.type === 'warning' ? 'text-amber-500' :
                        'text-emerald-500'
                      }`}>{alert.title}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{alert.time}</span>
                    </div>
                    <span className="text-xs text-muted-foreground mt-0.5 leading-tight">{alert.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Row 2: Vehicle Status, Rev vs Exp, Fuel Analytics */}
        <Card className="col-span-1 border-muted/50 shadow-sm bg-card">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-semibold">Vehicle Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between h-[220px]">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={vehicleStatusData} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                    {vehicleStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 flex flex-col gap-1.5 justify-center">
              {vehicleStatusData.map(stat => (
                <div key={stat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: stat.color }} />
                    <span className="text-muted-foreground">{stat.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold">{stat.value}</span>
                    <span className="text-muted-foreground text-[10px]">({Math.round((stat.value/150)*100)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2 xl:col-span-2 border-muted/50 shadow-sm bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Revenue vs Expenses</CardTitle>
            <select className="bg-muted text-xs border-none rounded px-2 py-1 outline-none text-muted-foreground">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => `${val}L`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                <Area type="monotone" dataKey="Profit" stroke="#3b82f6" strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 xl:col-span-1 border-muted/50 shadow-sm bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Fuel Analytics</CardTitle>
            <select className="bg-muted text-xs border-none rounded px-2 py-1 outline-none text-muted-foreground">
              <option>This Month</option>
            </select>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-blue-500/10 p-2 rounded flex flex-col">
                 <span className="text-[10px] text-blue-500 font-semibold uppercase tracking-wider">Fuel Used</span>
                 <span className="text-sm font-bold text-blue-500">12,450 L</span>
              </div>
              <div className="bg-amber-500/10 p-2 rounded flex flex-col">
                 <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">Fuel Cost</span>
                 <span className="text-sm font-bold text-amber-500">₹2.45L</span>
              </div>
              <div className="bg-emerald-500/10 p-2 rounded flex flex-col">
                 <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">Avg Mileage</span>
                 <span className="text-sm font-bold text-emerald-500">4.2 km/L</span>
              </div>
            </div>
            <div className="h-[120px] mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fuelData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} dy={5} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => `${val/1000}K`} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => `${val/1000}K`} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '10px' }} />
                  <Bar yAxisId="left" dataKey="used" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={12} />
                  <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Row 3: Maintenance Trend, Driver Perf, Recent Trips */}
        <Card className="col-span-1 border-muted/50 shadow-sm bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Maintenance Trend</CardTitle>
            <select className="bg-muted text-xs border-none rounded px-2 py-1 outline-none text-muted-foreground">
              <option>This Year</option>
            </select>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={maintenanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="Upcoming" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Overdue" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-1 xl:col-span-1 border-muted/50 shadow-sm bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Driver Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-muted-foreground uppercase bg-muted/30">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Rank</th>
                    <th className="px-4 py-2 font-semibold">Driver</th>
                    <th className="px-4 py-2 font-semibold">Trips</th>
                    <th className="px-4 py-2 font-semibold text-center">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {driverPerformance.map(driver => (
                    <tr key={driver.rank} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-bold">{driver.rank}</td>
                      <td className="px-4 py-2.5 flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center text-[8px] font-bold">
                          {driver.driver.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <span className="font-medium text-foreground">{driver.driver}</span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{driver.trips}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-bold text-emerald-500">{driver.safetyScore}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-1 xl:col-span-2 border-muted/50 shadow-sm bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent Trips</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-muted-foreground uppercase bg-muted/30">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Vehicle</th>
                    <th className="px-4 py-2 font-semibold">Driver</th>
                    <th className="px-4 py-2 font-semibold">Destination</th>
                    <th className="px-4 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recentTrips.map((trip, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-mono text-muted-foreground">{trip.vehicle}</td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{trip.driver}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{trip.dest}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${trip.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {trip.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex overflow-x-auto gap-4 py-2 scrollbar-none pb-8 mt-4">
        <ActionButton icon={<Truck />} title="Add Vehicle" desc="Register new vehicle" />
        <ActionButton icon={<Users />} title="Assign Driver" desc="Assign driver to vehicle" />
        <ActionButton icon={<Wrench />} title="Schedule Service" desc="Plan maintenance" />
        <ActionButton icon={<Droplets />} title="Add Fuel Log" desc="Record fuel entry" />
        <ActionButton icon={<FileText />} title="Generate Report" desc="Download reports" />
        <ActionButton icon={<AlertTriangle className="text-destructive" />} title="Emergency Alert" desc="Send emergency alert" className="border-destructive/30 hover:border-destructive/60" />
      </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, subtitle, trend, trendText, trendUp, icon }: any) {
  return (
    <Card className="border-muted/50 shadow-sm bg-card hover:border-primary/30 transition-colors">
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{title}</span>
            <span className="text-xl font-bold tracking-tight text-foreground leading-tight mt-1">{value}</span>
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-medium">
          {trendUp !== undefined && (
            <span className={`flex items-center ${trendUp ? 'text-emerald-500' : 'text-destructive'}`}>
              {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {trend}
            </span>
          )}
          <span className="text-muted-foreground">{trendText}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function ActionButton({ icon, title, desc, className }: any) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50 hover:bg-muted/50 cursor-pointer min-w-[200px] shrink-0 transition-colors ${className}`}>
      <div className="h-10 w-10 rounded-md bg-background border shadow-sm flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-foreground leading-tight">{title}</span>
        <span className="text-[10px] text-muted-foreground">{desc}</span>
      </div>
    </div>
  )
}

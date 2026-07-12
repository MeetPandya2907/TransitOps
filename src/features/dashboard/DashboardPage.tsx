import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { 
  Search, Sun, User,
  Truck, Activity, Fuel, Wrench, Users, DollarSign, 
  MapPin, ShieldAlert, CheckCircle2, FileDown,
  Calendar, Car, UserPlus, Clock, 
  AlertOctagon, Server, Database, RefreshCw, Smartphone, CheckSquare
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, ComposedChart, Bar
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';

// Define custom marker icon generator
const createGlowIcon = (colorHex: string) => L.divIcon({
  html: `<div style="width:14px;height:14px;border-radius:50%;background-color:${colorHex};border:2px solid white;box-shadow:0 0 10px ${colorHex}"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const DONUT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#64748b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const supabaseClient = createClient(); 

  // Fetch all necessary data for the 3rd Layout
  const fetchDashboardData = async () => {
    const [maintenanceRes, fuelRes, vehiclesRes, driversRes, tripsRes] = await Promise.all([
      supabaseClient.from('maintenance_logs').select('*, vehicles(license_plate)').order('created_at', { ascending: false }),
      supabaseClient.from('fuel_logs').select('*, vehicles(license_plate)').order('fuel_date', { ascending: false }),
      supabaseClient.from('vehicles').select('*'),
      supabaseClient.from('drivers').select('*'),
      supabaseClient.from('trips').select('*, vehicles(license_plate), drivers(name)').order('created_at', { ascending: false })
    ]);

    return {
      maintenance: maintenanceRes.data || [],
      fuel: fuelRes.data || [],
      vehicles: vehiclesRes.data || [],
      drivers: driversRes.data || [],
      trips: tripsRes.data || []
    };
  };

  const { data } = useQuery({ queryKey: ['dashboardData'], queryFn: fetchDashboardData });

  // Real-time subscriptions
  useEffect(() => {
    const channel1 = supabaseClient.channel('dashboard_maintenance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_logs' }, () => queryClient.invalidateQueries({ queryKey: ['dashboardData'] }))
      .subscribe();
      
    const channel2 = supabaseClient.channel('dashboard_fuel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fuel_logs' }, () => queryClient.invalidateQueries({ queryKey: ['dashboardData'] }))
      .subscribe();
      
    const channel3 = supabaseClient.channel('dashboard_trips')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => queryClient.invalidateQueries({ queryKey: ['dashboardData'] }))
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel1);
      supabaseClient.removeChannel(channel2);
      supabaseClient.removeChannel(channel3);
    };
  }, [supabaseClient, queryClient]);

  // Row 1 Metrics
  const totalVehiclesCount = data?.vehicles?.length || 0;
  const activeVehicles = data?.vehicles?.filter(v => v.status === 'Active').length || 0;
  const utilization = totalVehiclesCount > 0 ? Math.round((activeVehicles / totalVehiclesCount) * 100) : 0;
  
  const totalFuelCost = data?.fuel?.reduce((sum, log) => sum + Number(log.cost || 0), 0) || 0;
  
  const maintDueCount = data?.vehicles?.filter(v => v.status === 'Maintenance').length || 0;
  const criticalMaintCount = data?.maintenance?.filter(m => m.status === 'Critical').length || 0;
  
  const activeDriversCount = data?.drivers?.filter(d => d.status === 'Active').length || 0;
  
  // Dynamic Revenue based on trips
  const activeDistanceMiles = data?.trips?.filter(t => t.status !== 'Cancelled').reduce((sum, t) => sum + (Number(t.distance_miles) || 0), 0) || 0;
  const totalRevenue = Math.round(activeDistanceMiles * 1.609 * 80);

  // Row 2 Metrics - Fleet Health
  const healthScore = 96; 
  const healthComponents = [
     { name: 'Engine', val: 98 }, { name: 'Battery', val: 94 }, { name: 'Tyre', val: 92 },
     { name: 'Oil', val: 96 }, { name: 'Brake', val: 95 }, { name: 'Insurance', val: 90 }
  ];

  // Dynamic Alerts Generator
  const alerts = [
     ...(data?.maintenance?.filter(m => m.status === 'Critical').map(m => ({ icon: Wrench, color: 'text-red-500', bg: 'bg-red-500/10', title: 'Critical Maintenance', desc: `Vehicle ${m.vehicles?.license_plate || 'Unknown'} requires immediate service`, time: format(new Date(m.created_at || Date.now()), 'HH:mm') })) || []),
     ...(data?.fuel?.filter(f => Number(f.cost) > 5000).map(f => ({ icon: Fuel, color: 'text-amber-500', bg: 'bg-amber-500/10', title: 'High Fuel Expense', desc: `High fuel usage detected for ${f.vehicles?.license_plate || 'Unknown'}`, time: format(new Date(f.fuel_date || Date.now()), 'dd MMM') })) || []),
     ...(data?.vehicles?.filter(v => v.status === 'Maintenance').map(v => ({ icon: ShieldAlert, color: 'text-amber-500', bg: 'bg-amber-500/10', title: 'Vehicle Offline', desc: `Vehicle ${v.license_plate} is currently out of service`, time: 'Recent' })) || [])
  ];

  // Row 3 - Vehicle Status Donut
  const idleCount = data?.vehicles?.filter(v => v.status === 'Inactive').length || 0;
  const outOfServiceCount = data?.vehicles?.filter(v => v.status === 'Sold').length || 0;

  const pieData = [
    { name: 'Running', value: activeVehicles, perc: totalVehiclesCount ? `${Math.round(activeVehicles/totalVehiclesCount*100)}%` : '0%' },
    { name: 'Idle', value: idleCount, perc: totalVehiclesCount ? `${Math.round(idleCount/totalVehiclesCount*100)}%` : '0%' },
    { name: 'Maintenance', value: maintDueCount, perc: totalVehiclesCount ? `${Math.round(maintDueCount/totalVehiclesCount*100)}%` : '0%' },
    { name: 'Offline', value: outOfServiceCount, perc: totalVehiclesCount ? `${Math.round(outOfServiceCount/totalVehiclesCount*100)}%` : '0%' }
  ].filter(d => d.value > 0);

  // Dynamic Chart Generation Based on Real Data
  const last6Months = Array.from({length: 6}).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d;
  });

  const revExpData = last6Months.map(date => {
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const monthTrips = data?.trips?.filter(t => new Date(t.created_at).getMonth() === date.getMonth()) || [];
    const monthRevenue = monthTrips.reduce((sum, t) => sum + Math.round((Number(t.distance_miles) || 0) * 1.609 * 80), 0);
    const monthFuel = data?.fuel?.filter(f => new Date(f.fuel_date).getMonth() === date.getMonth()) || [];
    const monthExpense = monthFuel.reduce((sum, f) => sum + (Number(f.cost) || 0), 0);
    return { name: month, revenue: monthRevenue / 1000, expenses: monthExpense / 1000, profit: (monthRevenue - monthExpense) / 1000 };
  });
  
  const recentDays = Array.from({length: 6}).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (5 - i));
    return d;
  });

  const fuelAnaData = recentDays.map(date => {
    const day = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const dayFuel = data?.fuel?.filter(f => new Date(f.fuel_date).getDate() === date.getDate()) || [];
    const fuelUsed = dayFuel.reduce((sum, f) => sum + (Number(f.gallons) || 0), 0) * 3.785; // liters
    const fuelCost = dayFuel.reduce((sum, f) => sum + (Number(f.cost) || 0), 0);
    return { name: day, fuelUsed: Math.round(fuelUsed), fuelCost: Math.round(fuelCost) };
  });
  
  const maintTrendData = last6Months.map(date => {
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const monthMaint = data?.maintenance?.filter(m => new Date(m.created_at).getMonth() === date.getMonth()) || [];
    return { 
      name: month, 
      upcoming: monthMaint.filter(m => m.status === 'Pending').length, 
      completed: monthMaint.filter(m => m.status === 'Completed').length, 
      overdue: monthMaint.filter(m => m.status === 'Critical').length 
    };
  });

  // Row 4 - Tables (Dynamic Drivers)
  const topDrivers = data?.drivers?.slice(0,5).map((d, index) => {
      const driverTrips = data?.trips?.filter(t => t.driver_id === d.id) || [];
      const driverFuel = data?.fuel?.filter(f => f.driver_id === d.id) || [];
      return {
        rank: index + 1,
        name: d.first_name ? `${d.first_name} ${d.last_name}` : (d.name || 'Unknown Driver'),
        trips: driverTrips.length,
        fuel: Math.round(driverFuel.reduce((sum, f) => sum + Number(f.cost), 0) / 1000), // simplified score
        safety: 90 + Math.floor(Math.random()*10), // mock safety as it's not in db
        rating: d.status === 'Active' ? '4.8' : '4.2'
      };
  }).filter(d => d.name !== 'Unknown Driver') || [];

  const recentTrips = data?.trips?.slice(0,5).map(t => {
      const driverName = t.drivers ? (t.drivers.first_name ? `${t.drivers.first_name} ${t.drivers.last_name}` : t.drivers.name) : 'Unassigned';
      return {
        vehicle: t.vehicles?.license_plate || 'UNK',
        driver: driverName || 'Unassigned',
        start: format(new Date(t.created_at || Date.now()), 'dd MMM, HH:mm'),
        dest: t.end_location || t.destination || 'Unknown',
        dist: `${t.distance_miles ? Math.round(t.distance_miles * 1.609) : 0} km`,
        status: t.status || 'Completed'
      };
  }) || [];

  return (
    <div className="flex flex-col min-h-screen text-slate-200 bg-[#0b0e14] p-4 lg:p-6 overflow-x-hidden font-sans">
      
      {/* ----------------- Header ----------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-4">
         <div>
           <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Executive Dashboard</h1>
           <p className="text-[11px] text-slate-400 mt-0.5">Real-time overview of your fleet operations</p>
         </div>
         <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input type="text" placeholder="Search vehicles, drivers, locations..." className="bg-[#151923] border border-white/5 text-[11px] rounded-lg pl-9 pr-4 py-2 w-[280px] focus:outline-none focus:border-blue-500/50 text-white placeholder:text-slate-500" />
            </div>
            <div className="flex items-center bg-[#151923] border border-white/5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-300">
               May 28, 2025 <Calendar className="w-3.5 h-3.5 ml-2 text-slate-500" />
            </div>
            <button className="p-1.5 text-slate-400 hover:text-white"><Sun className="w-4 h-4" /></button>
         </div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {/* ----------------- Row 1: Top Metrics (6 Cards) ----------------- */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { title: 'Total Fleet', val: totalVehiclesCount, sub: 'Vehicles', trend: '↑ 8% vs last month', icon: Truck, color: 'blue' },
            { title: 'Active Vehicles', val: activeVehicles, sub: 'Running', trend: `${utilization}% Utilization`, icon: Activity, color: 'emerald', badge: 'Live' },
            { title: 'Fuel Cost (MTD)', val: `₹${totalFuelCost.toLocaleString()}`, sub: '', trend: '↓ 7% vs last month', icon: Fuel, color: 'amber' },
            { title: 'Maintenance Due', val: maintDueCount, sub: 'Vehicles', trend: `${criticalMaintCount} Critical`, trendColor: 'text-red-500', icon: Wrench, color: 'purple' },
            { title: 'Active Drivers', val: activeDriversCount, sub: 'Drivers', trend: '98% Attendance', icon: Users, color: 'blue' },
            { title: 'Revenue (MTD)', val: `₹${(totalRevenue/100000).toFixed(1)} Lakh`, sub: '', trend: '↑ 12% vs last month', icon: DollarSign, color: 'emerald' },
          ].map((card, i) => (
            <div key={i} className="bg-[#151923] border border-white/5 rounded-xl p-3.5 flex flex-col justify-between relative shadow-sm">
               <div className="flex justify-between items-start mb-2">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-opacity-10", 
                    card.color === 'blue' ? 'bg-blue-500 text-blue-500' : 
                    card.color === 'emerald' ? 'bg-emerald-500 text-emerald-500' : 
                    card.color === 'amber' ? 'bg-amber-500 text-amber-500' : 'bg-purple-500 text-purple-500'
                  )}>
                     <card.icon className="w-4 h-4" />
                  </div>
                  {card.badge && <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] px-1.5 py-0.5 rounded font-bold">{card.badge}</span>}
               </div>
               <div className="text-[11px] text-slate-400 mb-0.5">{card.title}</div>
               <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-white">{card.val}</span>
                  {card.sub && <span className="text-[10px] text-slate-500">{card.sub}</span>}
               </div>
               <div className={cn("text-[10px] mt-2 font-medium", card.trendColor || (card.trend.includes('↓') || card.trend.includes('Critical') ? 'text-red-500' : 'text-emerald-500'))}>
                  {card.trend}
               </div>
            </div>
          ))}
        </div>

        {/* ----------------- Row 2: Fleet Health, Map, Alerts (3 cols) ----------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* Fleet Health Score (col-span-1) */}
          <div className="bg-[#151923] border border-white/5 rounded-xl p-4 shadow-sm flex flex-col">
             <h3 className="text-xs font-semibold text-slate-200 mb-4">Fleet Health Score</h3>
             <div className="flex justify-center relative mb-4">
               {/* Semi-circle Gauge Mock */}
               <div className="w-40 h-20 overflow-hidden relative">
                 <div className="w-40 h-40 rounded-full border-[12px] border-slate-800 border-t-emerald-500 border-l-emerald-500 border-r-emerald-500 transform -rotate-45"></div>
               </div>
               <div className="absolute bottom-0 flex flex-col items-center">
                  <span className="text-3xl font-bold text-white">{healthScore}%</span>
                  <span className="text-[10px] text-emerald-500 font-semibold">Excellent</span>
               </div>
             </div>
             
             <div className="grid grid-cols-3 gap-2 text-center border-t border-b border-white/5 py-3 mb-4">
                <div><div className="text-lg font-bold text-red-500">2</div><div className="text-[9px] text-slate-500">Critical</div></div>
                <div className="border-l border-r border-white/5"><div className="text-lg font-bold text-amber-500">5</div><div className="text-[9px] text-slate-500">Warning</div></div>
                <div><div className="text-lg font-bold text-emerald-500">143</div><div className="text-[9px] text-slate-500">Healthy</div></div>
             </div>

             <div className="space-y-2.5">
                {healthComponents.map(c => (
                   <div key={c.name} className="flex items-center text-[10px]">
                      <span className="w-16 text-slate-400">{c.name}</span>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full mx-2 overflow-hidden">
                         <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${c.val}%` }}></div>
                      </div>
                      <span className="text-slate-300 w-6 text-right">{c.val}%</span>
                   </div>
                ))}
             </div>
          </div>

          {/* Live Fleet Map (col-span-2) */}
          <div className="lg:col-span-2 bg-[#151923] border border-white/5 rounded-xl shadow-sm relative overflow-hidden flex flex-col z-0">
             <div className="p-3 border-b border-white/5 flex justify-between items-center z-10 bg-[#151923] relative">
                <h3 className="text-xs font-semibold text-slate-200">Live Fleet Map</h3>
             </div>
             <div className="flex-1 relative w-full h-full min-h-[300px] z-0 map-container-override">
                <MapContainer center={[21.1702, 72.8311]} zoom={11} className="absolute inset-0 w-full h-full" zoomControl={false} attributionControl={false}>
                  {/* CartoDB Dark Matter Base Map */}
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  
                  {/* Dynamic Markers based on recent trips / vehicles */}
                  {recentTrips.map((trip, i) => {
                     // Generate deterministic pseudo-coordinates around center based on index
                     const lat = 21.1702 + (Math.sin(i * 123) * 0.15);
                     const lng = 72.8311 + (Math.cos(i * 321) * 0.15);
                     
                     let color = '#3b82f6'; // blue
                     if (trip.status === 'Completed') color = '#10b981'; // emerald
                     else if (trip.status === 'Maintenance') color = '#f59e0b'; // amber
                     
                     return (
                       <Marker key={i} position={[lat, lng]} icon={createGlowIcon(color)}>
                         <Popup className="custom-popup border-0 bg-transparent m-0 p-0 shadow-none">
                           <div className="bg-[#1a2130]/95 backdrop-blur-md border border-white/10 rounded-lg p-2.5 shadow-xl w-48 text-white">
                              <div className="flex justify-between items-center mb-2">
                                 <div className="flex items-center"><div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center mr-2"><Truck className="w-3 h-3 text-white" /></div><span className="text-[11px] font-bold text-white">{trip.vehicle}</span></div>
                                 <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded", trip.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400')}>{trip.status}</span>
                              </div>
                              <div className="text-[9px] text-slate-400 mb-1">{trip.driver}</div>
                              <div className="grid grid-cols-2 gap-2 text-[9px] mb-2">
                                 <div className="flex items-center text-slate-300"><Activity className="w-3 h-3 mr-1 text-slate-500"/> {Math.floor(Math.random()*40 + 40)} km/h</div>
                                 <div className="flex items-center text-slate-300"><Clock className="w-3 h-3 mr-1 text-slate-500"/> ETA: {format(new Date(Date.now() + 3600000), 'HH:mm')}</div>
                              </div>
                              <div className="flex items-center text-[9px] text-slate-300 mb-1 truncate"><MapPin className="w-3 h-3 mr-1 text-slate-500 shrink-0"/> {trip.dest}</div>
                              <div className="flex items-center text-[9px] text-slate-300"><Fuel className="w-3 h-3 mr-1 text-slate-500"/> Fuel: {Math.floor(Math.random()*60 + 20)}%</div>
                           </div>
                         </Popup>
                       </Marker>
                     );
                  })}
                </MapContainer>
             </div>
          </div>

          {/* Alerts & Notifications (col-span-1) */}
          <div className="bg-[#151923] border border-white/5 rounded-xl p-4 shadow-sm flex flex-col">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-xs font-semibold text-slate-200">Alerts & Notifications</h3>
               <button className="text-[9px] text-blue-500 hover:text-blue-400 font-medium">View All</button>
             </div>
             <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                {alerts.map((a, i) => (
                   <div key={i} className="flex items-start gap-3">
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", a.bg, a.color)}>
                         <a.icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start">
                            <h4 className={cn("text-[10px] font-semibold truncate", a.color)}>{a.title}</h4>
                            <span className="text-[8px] text-slate-500 whitespace-nowrap ml-2 mt-0.5">{a.time}</span>
                         </div>
                         <p className="text-[9px] text-slate-400 mt-0.5 leading-snug pr-4">{a.desc}</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>

        </div>

        {/* ----------------- Row 3: Vehicle Status, Rev/Exp, Fuel Ana (3 cols) ----------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Vehicle Status */}
          <div className="bg-[#151923] border border-white/5 rounded-xl p-4 shadow-sm flex flex-col">
             <h3 className="text-xs font-semibold text-slate-200 mb-2">Vehicle Status</h3>
             <div className="flex-1 flex items-center">
                <div className="w-[120px] h-[120px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie data={pieData} innerRadius={35} outerRadius={50} paddingAngle={2} dataKey="value" stroke="none">
                         {pieData.map((_entry, index) => <Cell key={`cell-${index}`} fill={DONUT_COLORS[index]} />)}
                       </Pie>
                     </PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="flex-1 ml-4 space-y-1.5">
                   {pieData.map((d, i) => (
                      <div key={d.name} className="flex justify-between items-center text-[9px]">
                         <div className="flex items-center text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full mr-2" style={{backgroundColor: DONUT_COLORS[i]}}></span>
                            {d.name}
                         </div>
                         <div className="text-slate-400 font-medium">
                            <span className="text-slate-200 mr-2">{d.value}</span> ({d.perc})
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Revenue vs Expenses */}
          <div className="bg-[#151923] border border-white/5 rounded-xl p-4 shadow-sm flex flex-col">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-xs font-semibold text-slate-200">Revenue vs Expenses</h3>
               <select className="bg-[#1e2330] border border-white/5 text-[9px] text-slate-300 rounded px-2 py-1 outline-none">
                 <option>This Year</option>
               </select>
             </div>
             <div className="flex justify-center gap-4 text-[9px] text-slate-400 mb-2">
                <div className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>Revenue</div>
                <div className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>Expenses</div>
                <div className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>Profit</div>
             </div>
             <div className="flex-1 w-full h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={revExpData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                     <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                     <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}L`} />
                     <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{r: 2}} />
                     <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{r: 2}} />
                     <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} dot={{r: 2}} />
                   </LineChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Fuel Analytics */}
          <div className="bg-[#151923] border border-white/5 rounded-xl p-4 shadow-sm flex flex-col">
             <div className="flex justify-between items-center mb-3">
               <h3 className="text-xs font-semibold text-slate-200">Fuel Analytics</h3>
               <select className="bg-[#1e2330] border border-white/5 text-[9px] text-slate-300 rounded px-2 py-1 outline-none">
                 <option>This Month</option>
               </select>
             </div>
             
             <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-[#1e2330] rounded p-2 border border-white/5">
                   <div className="text-[11px] font-bold text-blue-400">12,450 L</div>
                   <div className="text-[8px] text-slate-500">Fuel Used</div>
                </div>
                <div className="bg-[#1e2330] rounded p-2 border border-white/5 relative">
                   <div className="text-[11px] font-bold text-amber-500">₹2,45,900</div>
                   <div className="text-[8px] text-slate-500">Fuel Cost</div>
                   <Fuel className="w-3 h-3 absolute right-2 bottom-2 text-amber-500/20" />
                </div>
                <div className="bg-[#1e2330] rounded p-2 border border-white/5 relative">
                   <div className="flex items-center gap-1">
                      <div className="text-[11px] font-bold text-emerald-400">4.2 km/L</div>
                      <div className="text-[11px] font-bold text-purple-400 ml-auto">85<span className="text-[8px] text-slate-500">/100</span></div>
                   </div>
                   <div className="flex justify-between text-[8px] text-slate-500">
                      <span>Avg Mileage</span><span>Mileage Score</span>
                   </div>
                </div>
             </div>

             <div className="flex justify-center gap-4 text-[9px] text-slate-400 mb-1">
                <div className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5"></span>Fuel Used (L)</div>
                <div className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>Fuel Cost (₹)</div>
             </div>
             
             <div className="flex-1 w-full h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                   <ComposedChart data={fuelAnaData} margin={{ top: 5, right: -10, left: -25, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                     <XAxis dataKey="name" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} />
                     <YAxis yAxisId="left" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                     <YAxis yAxisId="right" orientation="right" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                     <Bar yAxisId="left" dataKey="fuelUsed" fill="#2563eb" barSize={6} radius={[2,2,0,0]} />
                     <Line yAxisId="right" type="monotone" dataKey="fuelCost" stroke="#f59e0b" strokeWidth={2} dot={{r: 2}} />
                   </ComposedChart>
                </ResponsiveContainer>
             </div>
          </div>

        </div>

        {/* ----------------- Row 4: Maint Trend, Driver Perf, Trips (3 cols) ----------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Maintenance Trend */}
          <div className="bg-[#151923] border border-white/5 rounded-xl p-4 shadow-sm flex flex-col">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-xs font-semibold text-slate-200">Maintenance Trend</h3>
               <select className="bg-[#1e2330] border border-white/5 text-[9px] text-slate-300 rounded px-2 py-1 outline-none">
                 <option>This Year</option>
               </select>
             </div>
             <div className="flex justify-center gap-4 text-[9px] text-slate-400 mb-2">
                <div className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>Upcoming</div>
                <div className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>Completed</div>
                <div className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>Overdue</div>
             </div>
             <div className="flex-1 w-full h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={maintTrendData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                     <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                     <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                     <Line type="monotone" dataKey="upcoming" stroke="#3b82f6" strokeWidth={2} dot={{r: 2}} />
                     <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={{r: 2}} />
                     <Line type="monotone" dataKey="overdue" stroke="#ef4444" strokeWidth={2} dot={{r: 2}} />
                   </LineChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Driver Performance */}
          <div className="bg-[#151923] border border-white/5 rounded-xl p-4 shadow-sm flex flex-col">
             <h3 className="text-xs font-semibold text-slate-200 mb-4">Driver Performance</h3>
             <div className="flex-1 overflow-auto custom-scrollbar">
               <table className="w-full text-[9px] text-left">
                  <thead className="text-slate-500 border-b border-white/5">
                     <tr>
                        <th className="pb-2 font-medium w-8">Rank</th>
                        <th className="pb-2 font-medium">Driver</th>
                        <th className="pb-2 font-medium text-center">Trips</th>
                        <th className="pb-2 font-medium text-center">Fuel Score</th>
                        <th className="pb-2 font-medium text-center">Safety Score</th>
                        <th className="pb-2 font-medium text-right">Rating</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {topDrivers.map((d, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                           <td className="py-2.5 text-slate-400">{d.rank}</td>
                           <td className="py-2.5 flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-slate-700 overflow-hidden"><User className="w-full h-full text-slate-400 p-0.5" /></div>
                              <span className="text-slate-200">{d.name}</span>
                           </td>
                           <td className="py-2.5 text-center text-slate-300">{d.trips}</td>
                           <td className="py-2.5 text-center text-slate-300">{d.fuel}</td>
                           <td className="py-2.5 text-center text-slate-300">{d.safety}</td>
                           <td className="py-2.5 text-right flex items-center justify-end text-amber-400">
                              <span className="text-amber-400 mr-1">★</span> {d.rating}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
             </div>
          </div>

          {/* Recent Trips */}
          <div className="bg-[#151923] border border-white/5 rounded-xl p-4 shadow-sm flex flex-col">
             <h3 className="text-xs font-semibold text-slate-200 mb-4">Recent Trips</h3>
             <div className="flex-1 overflow-auto custom-scrollbar">
               <table className="w-full text-[9px] text-left">
                  <thead className="text-slate-500 border-b border-white/5">
                     <tr>
                        <th className="pb-2 font-medium">Vehicle</th>
                        <th className="pb-2 font-medium">Driver</th>
                        <th className="pb-2 font-medium">Start</th>
                        <th className="pb-2 font-medium">Destination</th>
                        <th className="pb-2 font-medium text-right">Distance</th>
                        <th className="pb-2 font-medium text-right">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {recentTrips.map((t, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                           <td className="py-2.5 text-slate-200">{t.vehicle}</td>
                           <td className="py-2.5 text-slate-400">{t.driver}</td>
                           <td className="py-2.5 text-slate-400">{t.start}</td>
                           <td className="py-2.5 text-slate-300">{t.dest}</td>
                           <td className="py-2.5 text-right text-slate-300">{t.dist}</td>
                           <td className="py-2.5 text-right">
                              <span className={cn("px-1.5 py-0.5 rounded border text-[8px]", 
                                 t.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              )}>
                                 {t.status}
                              </span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
             </div>
          </div>

        </div>

        {/* ----------------- Quick Actions Bottom Row ----------------- */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-2">
           {[
              { title: 'Add Vehicle', sub: 'Register new vehicle', icon: Car, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { title: 'Assign Driver', sub: 'Assign driver to vehicle', icon: UserPlus, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { title: 'Schedule Service', sub: 'Plan maintenance', icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-500/10' },
              { title: 'Add Fuel Log', sub: 'Record fuel entry', icon: Fuel, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { title: 'Generate Report', sub: 'Download reports', icon: FileDown, color: 'text-pink-500', bg: 'bg-pink-500/10' },
              { title: 'Emergency Alert', sub: 'Send emergency alert', icon: AlertOctagon, color: 'text-red-500', bg: 'bg-red-500/10' },
           ].map((a, i) => (
              <button key={i} className="bg-[#151923] border border-white/5 rounded-xl p-3 flex items-center justify-between hover:bg-white/[0.04] transition-colors group text-left">
                 <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", a.bg, a.color)}>
                       <a.icon className="w-4 h-4" />
                    </div>
                    <div>
                       <div className="text-[11px] font-semibold text-slate-200 group-hover:text-white">{a.title}</div>
                       <div className="text-[9px] text-slate-500">{a.sub}</div>
                    </div>
                 </div>
                 <div className="text-slate-600 group-hover:text-slate-400">›</div>
              </button>
           ))}
        </div>

        {/* ----------------- Footer ----------------- */}
        <div className="flex flex-wrap items-center justify-between border-t border-white/5 pt-3 text-[9px] text-slate-500 pb-2">
           <div className="flex gap-6">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500"/> Server Status <span className="text-emerald-500">Healthy</span></div>
              <div className="flex items-center gap-1.5"><Server className="w-3 h-3 text-emerald-500"/> API Response <span className="text-emerald-500">152ms</span></div>
              <div className="flex items-center gap-1.5"><Database className="w-3 h-3 text-emerald-500"/> Database <span className="text-emerald-500">Connected</span></div>
              <div className="flex items-center gap-1.5"><RefreshCw className="w-3 h-3 text-emerald-500"/> Live Sync <span className="text-emerald-500">Active</span></div>
              <div className="flex items-center gap-1.5"><Smartphone className="w-3 h-3 text-slate-400"/> Devices Online <span className="text-white">142/150</span></div>
              <div className="flex items-center gap-1.5"><CheckSquare className="w-3 h-3 text-emerald-500"/> Today's Backup <span className="text-emerald-500">Completed</span></div>
           </div>
           <div>© 2025 TransitOps. All rights reserved. <span className="ml-4">v2.1.0</span></div>
        </div>

      </div>
    </div>
  );
}

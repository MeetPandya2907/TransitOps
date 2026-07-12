import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { 
  Search, Plus, Filter, X, MapPin, Truck, CheckCircle, Clock, 
  ArrowRight, User, Star, MoreVertical, Calendar, ChevronDown, Droplet, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function TripsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicles').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: driversList = [] } = useQuery({
    queryKey: ['driversList'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drivers').select('*, users(first_name, last_name)');
      if (error) throw error;
      return data;
    }
  });

  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startLocation || !endLocation || !vehicleId || !driverId) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('trips').insert([{
        start_location: startLocation,
        end_location: endLocation,
        vehicle_id: vehicleId,
        driver_id: driverId,
        status: 'Scheduled'
      }]);
      
      if (error) throw error;
      
      toast.success('Trip created successfully!');
      setIsModalOpen(false);
      setStartLocation('');
      setEndLocation('');
      setVehicleId('');
      setDriverId('');
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (tripId: string, newStatus: string) => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .update({ status: newStatus })
        .eq('id', tripId)
        .select();
        
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Update blocked by database security (RLS). Please check your policies.");
      }
      
      toast.success(`Trip status updated to ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          vehicles ( make, model, license_plate ),
          drivers ( users ( first_name, last_name ), driver_license ( license_number ) )
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    }
  });

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = 
      trip.start_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.end_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.vehicles?.license_plate?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0e14] text-slate-200 font-sans p-4 lg:p-6 overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
         <div>
           <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Completed Trips</h1>
           <p className="text-[11px] text-slate-400 mt-0.5">View and analyze all completed fleet operations</p>
         </div>
         <button 
           onClick={() => setIsModalOpen(true)}
           className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center transition-colors"
         >
            <Plus className="w-4 h-4 mr-2" /> New Trip
         </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Trips', value: trips.length, trend: '+12.5%', isUp: true, icon: <Truck className="w-4 h-4 text-blue-400" />, bg: 'bg-blue-500/10' },
          { label: 'Completed', value: trips.filter(t => t.status === 'Completed').length, trend: '+15.3%', isUp: true, icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, bg: 'bg-emerald-500/10' },
          { label: 'In Progress', value: trips.filter(t => t.status === 'In Progress').length, trend: '-5.2%', isUp: false, icon: <Truck className="w-4 h-4 text-blue-400" />, bg: 'bg-blue-500/10' },
          { label: 'Scheduled', value: trips.filter(t => t.status === 'Scheduled').length, trend: '+3.1%', isUp: true, icon: <Calendar className="w-4 h-4 text-amber-400" />, bg: 'bg-amber-500/10' },
          { label: 'Cancelled', value: trips.filter(t => t.status === 'Cancelled').length, trend: '-2.4%', isUp: false, icon: <X className="w-4 h-4 text-red-400" />, bg: 'bg-red-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#151923] border border-slate-700/50 rounded-xl p-4 flex items-center shadow-sm">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mr-4 shrink-0", stat.bg)}>
              {stat.icon}
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{stat.label}</div>
              <div className="text-xl font-bold text-slate-100">{stat.value}</div>
              <div className={cn("text-[9px] font-bold mt-1", stat.isUp ? "text-emerald-400" : "text-red-400")}>
                {stat.isUp ? '↑' : '↓'} {stat.trend} <span className="text-slate-500 font-medium">vs last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-[#151923] border border-slate-700/50 rounded-xl p-3 mb-6 flex flex-col md:flex-row items-center gap-3">
         <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input 
              type="text" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#0b0e14] border border-slate-700/50 rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:border-[#0b84ff] focus:ring-1 focus:ring-[#0b84ff] focus:outline-none transition-all placeholder:text-slate-600"
              placeholder="Search by location, vehicle or driver..."
            />
         </div>
         
         <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto scrollbar-hide">
            <button className="flex items-center justify-between px-4 py-2 bg-[#0b0e14] border border-slate-700/50 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors min-w-[140px]">
              <div className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-2 text-slate-500" /> Date Range</div> <ChevronDown className="w-3.5 h-3.5 ml-2 text-slate-500" />
            </button>
            <button className="flex items-center justify-between px-4 py-2 bg-[#0b0e14] border border-slate-700/50 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors min-w-[140px]">
              <div className="flex items-center"><Truck className="w-3.5 h-3.5 mr-2 text-slate-500" /> All Vehicles</div> <ChevronDown className="w-3.5 h-3.5 ml-2 text-slate-500" />
            </button>
            <button className="flex items-center justify-between px-4 py-2 bg-[#0b0e14] border border-slate-700/50 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors min-w-[140px]">
              <div className="flex items-center"><User className="w-3.5 h-3.5 mr-2 text-slate-500" /> All Drivers</div> <ChevronDown className="w-3.5 h-3.5 ml-2 text-slate-500" />
            </button>
            <button className="p-2 bg-[#0b0e14] border border-slate-700/50 rounded-lg text-slate-300 hover:text-white transition-colors flex items-center">
               <Filter className="w-3.5 h-3.5 mr-2" /> <span className="text-xs font-medium">Filters</span> <ChevronDown className="w-3 h-3 ml-2 text-slate-500" />
            </button>
         </div>
      </div>

      {/* Trips Grid */}
      <div className="flex-1 overflow-auto pr-2 pb-20 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500 bg-[#151923] rounded-xl border border-slate-700/50">
            <MapPin className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No trips found matching your criteria</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredTrips.map(trip => {
              const vehicle = trip.vehicles || {};
              const driver = trip.drivers?.users || {};
              const driverName = driver.first_name ? `${driver.first_name} ${driver.last_name}` : 'No Driver';
              
              // Mocked Data for UI Demonstration
              const cargoLoad = Math.floor(Math.random() * 5) + 5; // e.g., 12 Tons
              const distanceKm = trip.distance_miles ? Math.round(trip.distance_miles * 1.609) : Math.floor(Math.random() * 500) + 100;
              const durationHours = Math.floor(distanceKm / 60);
              const durationMins = Math.floor(Math.random() * 60);
              const fuelUsed = Math.floor(distanceKm / 8);
              const fuelCost = fuelUsed * 95;
              const mileage = (distanceKm / fuelUsed).toFixed(1);
              
              const isCompleted = trip.status === 'Completed';
              const isCancelled = trip.status === 'Cancelled';
              
              return (
                <div key={trip.id} className="bg-[#151923] border border-slate-700/50 rounded-xl overflow-hidden flex flex-col group relative shadow-lg">
                  {/* Main Row */}
                  <div className="p-5 flex flex-col xl:flex-row items-start xl:items-center gap-6">
                    
                    {/* Vehicle Info */}
                    <div className="flex w-full xl:w-[22%]">
                      <div className="flex flex-col items-center mr-4 w-24 shrink-0">
                        <select
                          value={trip.status}
                          onChange={(e) => handleStatusChange(trip.id, e.target.value)}
                          className={cn(
                            "px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider mb-3 w-full text-center border appearance-none outline-none cursor-pointer",
                            trip.status === 'Completed' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                            trip.status === 'In Progress' ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
                            trip.status === 'Cancelled' ? "bg-red-500/10 text-red-400 border-red-500/30" :
                            "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          )}
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <div className="w-16 h-12 bg-[#0b0e14] rounded-lg border border-slate-700 flex items-center justify-center shrink-0">
                          <Truck className="w-6 h-6 text-slate-500" />
                        </div>
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="text-sm font-bold text-white mb-1">{vehicle.license_plate || 'Unassigned'}</div>
                        <div className="text-[10px] text-slate-400 mb-2">{vehicle.make} {vehicle.model}</div>
                        <span className="bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded w-max">
                          Truck
                        </span>
                      </div>
                    </div>

                    {/* Routing Info */}
                    <div className="flex w-full xl:w-[28%] items-center justify-between xl:px-4 border-t xl:border-t-0 xl:border-x border-slate-700/50 pt-4 xl:pt-0 mt-2 xl:mt-0">
                      <div className="flex flex-col">
                        <div className="flex items-center text-sm font-bold text-white mb-1">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-500" /> {trip.start_location}
                        </div>
                        <div className="text-[9px] text-slate-500 mb-4 pl-4.5">GJ, India<br/>09 Jul 2026, 09:12 AM</div>
                        
                        <div className="flex items-center text-[10px] text-slate-400 pl-4.5">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" /> 
                          <div><span className="font-bold text-slate-300">{durationHours}h {durationMins}m</span><br/>Duration</div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center px-4">
                        <div className="text-[10px] font-bold text-blue-400 mb-1">{distanceKm} km</div>
                        <div className="flex items-center w-16 md:w-24">
                          <div className="h-px bg-slate-700 flex-1 border-dashed border-t border-slate-700"></div>
                          <ArrowRight className="w-3 h-3 text-slate-500 mx-1" />
                        </div>
                      </div>

                      <div className="flex flex-col text-right items-end">
                        <div className="flex items-center text-sm font-bold text-white mb-1">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-red-500" /> {trip.end_location}
                        </div>
                        <div className="text-[9px] text-slate-500 mb-4 pr-4.5 text-right">GJ, India<br/>09 Jul 2026, 01:44 PM</div>
                        
                        <div className="flex items-center justify-end text-[10px] text-slate-400 pr-4.5 w-full">
                          <svg className="w-3.5 h-3.5 mr-1 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                          <div className="text-left"><span className="font-bold text-slate-300">62 km/h</span><br/>Avg Speed</div>
                        </div>
                      </div>
                    </div>

                    {/* Driver Info */}
                    <div className="flex w-full xl:w-[18%] items-center xl:px-4 xl:border-r border-slate-700/50 pt-4 xl:pt-0 border-t xl:border-t-0 mt-2 xl:mt-0">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mr-3 shrink-0 overflow-hidden">
                         {driver.avatar_url ? <img src={driver.avatar_url} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-slate-500" />}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-xs font-bold text-white line-clamp-1">{driverName}</div>
                          <span className="bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">Driver</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mb-2">+91 98765 43210</div>
                        <div className="flex items-center text-[10px] text-slate-300 font-bold">
                          <Star className="w-3 h-3 text-amber-500 mr-1 fill-amber-500" /> 4.9 <span className="text-slate-500 font-normal ml-1">(128)</span>
                        </div>
                      </div>
                    </div>

                    {/* Fuel Metrics */}
                    <div className="flex w-full xl:w-[15%] flex-col gap-3 xl:px-4 xl:border-r border-slate-700/50 pt-4 xl:pt-0 border-t xl:border-t-0 mt-2 xl:mt-0">
                       <div className="flex items-start">
                         <Droplet className="w-3.5 h-3.5 text-amber-400 mr-2 mt-0.5" />
                         <div>
                           <div className="text-[9px] text-slate-400 font-medium leading-none mb-1">Fuel Used</div>
                           <div className="text-xs font-bold text-slate-200 leading-none">{fuelUsed} L</div>
                         </div>
                       </div>
                       <div className="flex items-start">
                         <svg className="w-3.5 h-3.5 text-emerald-400 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M17 12h.01"/><path d="M7 12h.01"/></svg>
                         <div>
                           <div className="text-[9px] text-slate-400 font-medium leading-none mb-1">Fuel Cost</div>
                           <div className="text-xs font-bold text-slate-200 leading-none">₹{fuelCost.toLocaleString()}</div>
                         </div>
                       </div>
                       <div className="flex items-start">
                         <TrendingUp className="w-3.5 h-3.5 text-blue-400 mr-2 mt-0.5" />
                         <div>
                           <div className="text-[9px] text-slate-400 font-medium leading-none mb-1">Mileage</div>
                           <div className="text-xs font-bold text-blue-400 leading-none">{mileage} km/L</div>
                         </div>
                       </div>
                    </div>

                    {/* Right Info */}
                    <div className="flex w-full xl:w-[17%] flex-col xl:px-4 pt-4 xl:pt-0 border-t xl:border-t-0 mt-2 xl:mt-0">
                       <div className="flex items-center justify-end w-full mb-3">
                         <Calendar className="w-3 h-3 text-slate-500 mr-1" />
                         <span className="text-[9px] text-slate-400">09 Jul 2026</span>
                         <MoreVertical className="w-4 h-4 text-slate-500 ml-3 cursor-pointer" />
                       </div>
                       <div className="flex items-start mb-3">
                         <Truck className="w-3.5 h-3.5 text-amber-500 mr-2 mt-0.5" />
                         <div>
                           <div className="text-[9px] text-slate-400 font-medium leading-none mb-1">Cargo Weight</div>
                           <div className="text-xs font-bold text-slate-200 leading-none">{cargoLoad} Tons</div>
                         </div>
                       </div>
                       <div className="flex items-start mb-3">
                         <Clock className="w-3.5 h-3.5 text-amber-500 mr-2 mt-0.5" />
                         <div>
                           <div className="text-[9px] text-slate-400 font-medium leading-none mb-1">ETA</div>
                           <div className="text-xs font-bold text-slate-200 leading-none">01:30 PM</div>
                         </div>
                       </div>
                       <div className="flex items-start">
                         <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mr-2 mt-0.5" />
                         <div>
                           <div className="text-[9px] text-slate-400 font-medium leading-none mb-1">ETA</div>
                           <div className="text-xs font-bold text-emerald-500 leading-none">On Time</div>
                         </div>
                       </div>
                    </div>
                  </div>

                  {/* Bottom Bar */}
                  <div className="bg-[#0b0e14] px-5 py-3 flex items-center justify-between border-t border-slate-700/50">
                    <div className={cn(
                      "flex items-center text-[10px] font-bold",
                      isCompleted ? "text-emerald-500" :
                      isCancelled ? "text-red-500" :
                      trip.status === 'In Progress' ? "text-blue-500" : "text-amber-500"
                    )}>
                      {isCompleted ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : 
                       isCancelled ? <X className="w-3.5 h-3.5 mr-1.5" /> :
                       <Clock className="w-3.5 h-3.5 mr-1.5" />} 
                      {isCompleted ? 'Delivered Successfully' : 
                       isCancelled ? 'Trip Cancelled' :
                       trip.status === 'In Progress' ? 'On Route' : 'Awaiting Dispatch'}
                    </div>
                    <button 
                      onClick={() => setSelectedTrip(trip)}
                      className="bg-blue-600/10 text-blue-500 border border-blue-500/30 hover:bg-blue-600 hover:text-white px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center"
                    >
                      View Details <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Add Trip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#151923] border border-slate-700/50 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-[#0b0e14]/50">
              <h3 className="text-lg font-bold text-white tracking-tight">Create New Trip</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form className="p-6 space-y-4" onSubmit={handleAddTrip}>
              <div className="space-y-4">
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Origin</label>
                  <input 
                    type="text"
                    value={startLocation}
                    onChange={e => setStartLocation(e.target.value)}
                    placeholder="Enter starting location"
                    className="w-full bg-[#0b0e14] border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Destination</label>
                  <input 
                    type="text"
                    value={endLocation}
                    onChange={e => setEndLocation(e.target.value)}
                    placeholder="Enter ending location"
                    className="w-full bg-[#0b0e14] border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Vehicle</label>
                    <select 
                      value={vehicleId}
                      onChange={e => setVehicleId(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select vehicle...</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.license_plate}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Driver</label>
                    <select 
                      value={driverId}
                      onChange={e => setDriverId(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select driver...</option>
                      {driversList.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.users ? `${d.users.first_name} ${d.users.last_name}` : 'Unknown Driver'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>

              <div className="pt-6 mt-6 border-t border-slate-700/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#151923] border border-slate-700/50 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-[#0b0e14]/50">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight flex items-center">
                  Trip Details <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">{selectedTrip.status}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">ID: {selectedTrip.id}</p>
              </div>
              <button 
                onClick={() => setSelectedTrip(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
               <div className="flex items-center justify-between bg-[#0b0e14] p-4 rounded-xl border border-slate-700/50 mb-6">
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Origin</span>
                   <span className="text-base font-bold text-white flex items-center"><MapPin className="w-4 h-4 mr-2 text-emerald-500" /> {selectedTrip.start_location}</span>
                 </div>
                 <ArrowRight className="w-6 h-6 text-slate-600" />
                 <div className="flex flex-col text-right items-end">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Destination</span>
                   <span className="text-base font-bold text-white flex items-center"><MapPin className="w-4 h-4 mr-2 text-red-500" /> {selectedTrip.end_location}</span>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-[#0b0e14] p-4 rounded-xl border border-slate-700/50">
                    <div className="flex items-center mb-3">
                      <Truck className="w-4 h-4 text-blue-400 mr-2" />
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Vehicle Info</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-xs text-slate-400">License Plate</span> <span className="text-xs font-bold text-white">{selectedTrip.vehicles?.license_plate || 'Unassigned'}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-slate-400">Make & Model</span> <span className="text-xs font-bold text-white">{selectedTrip.vehicles?.make} {selectedTrip.vehicles?.model}</span></div>
                    </div>
                 </div>
                 <div className="bg-[#0b0e14] p-4 rounded-xl border border-slate-700/50">
                    <div className="flex items-center mb-3">
                      <User className="w-4 h-4 text-amber-400 mr-2" />
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Driver Info</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-xs text-slate-400">Name</span> <span className="text-xs font-bold text-white">{selectedTrip.drivers?.users ? `${selectedTrip.drivers.users.first_name} ${selectedTrip.drivers.users.last_name}` : 'Unassigned'}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-slate-400">License</span> <span className="text-xs font-bold text-white">{selectedTrip.drivers?.driver_license?.[0]?.license_number || 'N/A'}</span></div>
                    </div>
                 </div>
               </div>
            </div>
            
            <div className="p-4 border-t border-slate-700/50 bg-[#0b0e14]/50 flex justify-end">
              <button 
                onClick={() => setSelectedTrip(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-6 py-2.5 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

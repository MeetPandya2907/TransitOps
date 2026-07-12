import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { 
  Search, Plus, Filter, User, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

export default function DriversPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState('');
  const [regionId, setRegionId] = useState('');
  const [hireDate, setHireDate] = useState('');
  
  // New License & Status State
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseClass, setLicenseClass] = useState('LMV');
  const [expiryDate, setExpiryDate] = useState('');
  const [driverStatus, setDriverStatus] = useState('Available');
  
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('regions').select('*');
      if (error) throw error;
      return data;
    }
  });

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !regionId || !hireDate) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from('drivers').insert([{
        user_id: userId,
        region_id: regionId,
        hire_date: hireDate,
        status: driverStatus
      }]).select().single();
      
      if (error) throw error;
      
      const driverId = data.id;
      
      // Also insert license if provided
      if (licenseNumber && expiryDate) {
        const { error: licenseError } = await supabase.from('driver_license').insert([{
          driver_id: driverId,
          license_number: licenseNumber,
          license_class: licenseClass,
          expiry_date: expiryDate
        }]);
        if (licenseError) throw licenseError;
      }
      
      toast.success('Driver added successfully!');
      setIsModalOpen(false);
      
      // Reset State
      setUserId('');
      setRegionId('');
      setHireDate('');
      setLicenseNumber('');
      setLicenseClass('LMV');
      setExpiryDate('');
      setDriverStatus('Available');
      
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to add driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (driverId: string, newStatus: string) => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .update({ status: newStatus })
        .eq('id', driverId)
        .select();
        
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Update blocked by database security (RLS). Please run the fix_update.sql script in Supabase.");
      }
      
      toast.success(`Driver status updated to ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          *,
          users ( first_name, last_name, email, avatar_url ),
          regions ( name ),
          driver_license ( license_number, license_class, expiry_date )
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    }
  });

  const filteredDrivers = drivers.filter(driver => {
    const name = `${driver.users?.first_name || ''} ${driver.users?.last_name || ''}`.toLowerCase();
    const email = driver.users?.email?.toLowerCase() || '';
    
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || driver.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0e14] text-slate-200 font-sans p-4 lg:p-6 overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
         <div>
           <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Driver Roster</h1>
           <p className="text-[11px] text-slate-400 mt-0.5">Manage your fleet personnel and assignments</p>
         </div>
         <button 
           onClick={() => setIsModalOpen(true)}
           className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center transition-colors"
         >
            <Plus className="w-4 h-4 mr-2" /> Add Driver
         </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-[#151923] border border-slate-700/50 rounded-xl p-4 mb-6">
         <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-500" />
               </div>
               <input 
                 type="text" 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="w-full bg-[#0b0e14] border border-slate-700/50 rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:border-[#0b84ff] focus:ring-1 focus:ring-[#0b84ff] focus:outline-none transition-all placeholder:text-slate-600"
                 placeholder="Search by name or email..."
               />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
               {['All', 'Available', 'On Trip', 'Off Duty'].map(status => (
                 <button
                   key={status}
                   onClick={() => setStatusFilter(status)}
                   className={cn(
                     "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border",
                     statusFilter === status 
                       ? "bg-blue-600/10 text-blue-500 border-blue-500/30" 
                       : "bg-[#0b0e14] text-slate-400 border-slate-700/50 hover:bg-slate-800"
                   )}
                 >
                   {status}
                 </button>
               ))}
               <button className="p-2 bg-[#0b0e14] border border-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors">
                  <Filter className="w-4 h-4" />
               </button>
            </div>
         </div>
      </div>

      {/* Drivers Table */}
      <div className="flex-1 overflow-auto pr-2 pb-20 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500 bg-[#151923] rounded-xl border border-slate-700/50">
            <User className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No drivers found matching your criteria</p>
          </div>
        ) : (
          <div className="bg-[#151923] border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0b0e14] border-b border-slate-700/50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    <th className="p-4 pl-6 font-semibold">Driver</th>
                    <th className="p-4 font-semibold">License No.</th>
                    <th className="p-4 font-semibold">Category</th>
                    <th className="p-4 font-semibold">Expiry</th>
                    <th className="p-4 font-semibold">Contact</th>
                    <th className="p-4 font-semibold">Trip Compl.</th>
                    <th className="p-4 font-semibold">Safety</th>
                    <th className="p-4 pr-6 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {filteredDrivers.map(driver => {
                    const license = driver.driver_license?.[0] || {};
                    const isSuspended = driver.status === 'Suspended';
                    const tripCompl = Math.floor(Math.random() * 20) + 80; // Mocked 80-99%

                    return (
                      <tr key={driver.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-4 pl-6">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-700">
                              {driver.users?.avatar_url ? (
                                <img src={driver.users.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4 text-slate-500" />
                              )}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-bold text-slate-200">
                                {driver.users ? `${driver.users.first_name || ''} ${driver.users.last_name || ''}` : 'Unknown Driver'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-medium text-slate-300">
                          {license.license_number || 'N/A'}
                        </td>
                        <td className="p-4 text-xs text-slate-400">
                          {license.license_class || 'N/A'}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center">
                            <span className="text-xs text-slate-300 mr-2">
                              {license.expiry_date ? format(parseISO(license.expiry_date), 'MM/yyyy') : 'N/A'}
                            </span>
                            {/* Mock logic for 'EXPIRE' badge */}
                            {license.expiry_date && new Date(license.expiry_date) < new Date('2026-01-01') && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">
                                Expire
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-xs text-slate-400 truncate max-w-[120px]" title={driver.users?.email}>
                          {driver.users?.email || 'N/A'}
                        </td>
                        <td className="p-4 text-xs font-semibold text-slate-300">
                          {tripCompl}%
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                            isSuspended ? "bg-orange-500/20 text-orange-400 border border-orange-500/20" :
                            driver.status === 'On Trip' ? "bg-blue-500/20 text-blue-400 border border-blue-500/20" :
                            "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                          )}>
                            {isSuspended ? 'Suspended' : driver.status === 'On Trip' ? 'On Trip' : 'Available'}
                          </span>
                        </td>
                        <td className="p-4 pr-6">
                          <select 
                            value={driver.status}
                            onChange={(e) => handleStatusChange(driver.id, e.target.value)}
                            className={cn(
                              "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider outline-none appearance-none cursor-pointer",
                              isSuspended ? "bg-orange-500 text-white" :
                              driver.status === 'On Trip' ? "bg-blue-600 text-white" :
                              driver.status === 'Off Duty' ? "bg-slate-600 text-white" :
                              "bg-emerald-600 text-white"
                            )}
                          >
                            <option value="Available">Available</option>
                            <option value="On Trip">On Trip</option>
                            <option value="Off Duty">Off Duty</option>
                            <option value="Suspended">Suspended</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Toggle Stats Legend */}
        <div className="mt-8 flex flex-col space-y-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toggle Stat</div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-900/20">Available</span>
            <span className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-900/20">On Trip</span>
            <span className="px-4 py-2 rounded-lg bg-slate-600 text-white text-xs font-bold shadow-lg shadow-slate-900/20">Off Duty</span>
            <span className="px-4 py-2 rounded-lg bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-900/20">Suspended</span>
          </div>
          <p className="text-xs text-orange-400 font-medium mt-1">Rule: Expired license or Suspended status → blocked from trip assignment</p>
        </div>
      </div>
      
      {/* Add Driver Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#151923] border border-slate-700/50 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-[#0b0e14]/50">
              <h3 className="text-lg font-bold text-white tracking-tight">Add New Driver</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form className="p-6 space-y-4" onSubmit={handleAddDriver}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Select User</label>
                    <select 
                      value={userId}
                      onChange={e => setUserId(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select a registered user...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Region</label>
                    <select 
                      value={regionId}
                      onChange={e => setRegionId(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select region...</option>
                      {regions.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Hire Date</label>
                    <input 
                      type="date"
                      value={hireDate}
                      onChange={e => setHireDate(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Status</label>
                    <select 
                      value={driverStatus}
                      onChange={e => setDriverStatus(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="Available">Available</option>
                      <option value="On Trip">On Trip</option>
                      <option value="Off Duty">Off Duty</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-700/50 pt-4 mt-2">
                  <h4 className="text-xs font-bold text-slate-300 mb-4 uppercase tracking-widest">License Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">License Number</label>
                      <input 
                        type="text"
                        placeholder="e.g. DL-88213"
                        value={licenseNumber}
                        onChange={e => setLicenseNumber(e.target.value)}
                        className="w-full bg-[#0b0e14] border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Category</label>
                      <select 
                        value={licenseClass}
                        onChange={e => setLicenseClass(e.target.value)}
                        className="w-full bg-[#0b0e14] border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        <option value="LMV">LMV (Light Motor Vehicle)</option>
                        <option value="HMV">HMV (Heavy Motor Vehicle)</option>
                        <option value="MCWG">MCWG (Motorcycle with Gear)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Expiry Date</label>
                      <input 
                        type="date"
                        value={expiryDate}
                        onChange={e => setExpiryDate(e.target.value)}
                        className="w-full bg-[#0b0e14] border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none [color-scheme:dark]"
                      />
                    </div>
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
                  {isSubmitting ? 'Adding...' : 'Add Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

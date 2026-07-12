import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Wrench, AlertTriangle, CheckCircle2, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Static fallback data if database is empty
const STATIC_MAINTENANCE_LOGS = [
  { id: '1', vehicles: { make: 'Tata', model: 'Prima', license_plate: 'GJ05 AB 1234' }, service_type: 'Oil Change', description: 'Routine engine oil and filter change', status: 'Pending', scheduled_date: new Date().toISOString(), cost: 4500 },
  { id: '2', vehicles: { make: 'Ashok Leyland', model: 'Boss', license_plate: 'GJ12 XY 5678' }, service_type: 'Brake Inspection', description: 'Replace worn out brake pads', status: 'Critical', scheduled_date: new Date(Date.now() - 86400000).toISOString(), cost: 12000 },
  { id: '3', vehicles: { make: 'Mahindra', model: 'Blazo', license_plate: 'GJ01 KL 9001' }, service_type: 'Tire Replacement', description: 'Replace 4 rear tires', status: 'In Progress', scheduled_date: new Date().toISOString(), cost: 32000 },
  { id: '4', vehicles: { make: 'Volvo', model: 'FM', license_plate: 'GJ05 MN 3456' }, service_type: 'Engine Overhaul', description: 'Complete engine tuning and overhaul', status: 'Completed', scheduled_date: new Date(Date.now() - 5*86400000).toISOString(), cost: 85000 },
];

export default function MaintenancePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    vehicle_id: '',
    service_type: 'Oil Change',
    description: '',
    status: 'Pending',
    cost: ''
  });

  const queryClient = useQueryClient();
  const supabaseClient = createClient(); 

  const fetchMaintenanceLogs = async () => {
    const { data, error } = await supabaseClient
      .from('maintenance_logs')
      .select(`
        *,
        vehicles (
          license_plate,
          make,
          model
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  const { data: dbLogs = [], isLoading, isError } = useQuery({
    queryKey: ['maintenanceLogs'],
    queryFn: fetchMaintenanceLogs,
  });

  const fetchVehicles = async () => {
    const { data, error } = await supabaseClient.from('vehicles').select('id, license_plate');
    if (error) throw error;
    return data;
  };

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehiclesList'],
    queryFn: fetchVehicles,
  });

  // Mock vehicles fallback if db is empty
  const mockVehicles = [
    { id: '123e4567-e89b-12d3-a456-426614174000', license_plate: 'GJ05 AB 1234 (Mock)' },
    { id: '123e4567-e89b-12d3-a456-426614174001', license_plate: 'GJ12 XY 5678 (Mock)' },
    { id: '123e4567-e89b-12d3-a456-426614174002', license_plate: 'GJ01 KL 9001 (Mock)' },
  ];
  const vehicleOptions = vehicles.length > 0 ? vehicles : mockVehicles;

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabaseClient
      .channel('public:maintenance_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['maintenanceLogs'] });
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [supabaseClient, queryClient]);

  // Use static data if DB is completely empty (for demo purposes)
  const logs = dbLogs.length > 0 ? dbLogs : STATIC_MAINTENANCE_LOGS;

  // Derived stats from data
  const pendingCount = logs.filter((log: any) => log.status === 'Pending').length;
  const inProgressCount = logs.filter((log: any) => log.status === 'In Progress').length;
  const completedCount = logs.filter((log: any) => log.status === 'Completed').length;
  const criticalCount = logs.filter((log: any) => log.status === 'Critical').length;

  const stats = [
    { name: 'Pending Maintenance', stat: pendingCount.toString(), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { name: 'In Progress', stat: inProgressCount.toString(), icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Completed This Month', stat: completedCount.toString(), icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Critical Alerts', stat: criticalCount.toString(), icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
  ];

  const filteredLogs = logs.filter((log: any) => {
    const searchString = `${log.vehicles?.license_plate || ''} ${log.vehicles?.make || ''} ${log.vehicles?.model || ''} ${log.service_type || ''} ${log.status || ''} ${log.description || ''} ${log.cost || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && log.status === statusFilter;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicle_id) return;
    
    setIsSubmitting(true);
    setSubmitError('');
    try {
      if (editingLogId) {
        const { error } = await supabaseClient
          .from('maintenance_logs')
          .update({
            vehicle_id: formData.vehicle_id,
            service_type: formData.service_type,
            description: formData.description,
            status: formData.status,
            cost: formData.cost ? Number(formData.cost) : 0
          })
          .eq('id', editingLogId);
          
        if (error) throw error;
      } else {
        const { error } = await supabaseClient
          .from('maintenance_logs')
          .insert([{
            vehicle_id: formData.vehicle_id,
            service_type: formData.service_type,
            description: formData.description,
            status: formData.status,
            scheduled_date: new Date().toISOString().split('T')[0],
            cost: formData.cost ? Number(formData.cost) : 0
          }]);
          
        if (error) throw error;
      }
      
      queryClient.invalidateQueries({ queryKey: ['maintenanceLogs'] });
      
      setEditingLogId(null);
      setFormData({ vehicle_id: '', service_type: 'Oil Change', description: '', status: 'Pending', cost: '' });
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error submitting request:', err);
      // Friendly error if it's a foreign key constraint (due to mock data)
      if (err.code === '23503') {
         setSubmitError("Cannot submit with Mock Data. Please add a real vehicle to your fleet first.");
      } else {
         setSubmitError(err.message || 'Failed to submit request.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (log: any) => {
    setEditingLogId(log.id);
    setFormData({
      vehicle_id: log.vehicle_id || '',
      service_type: log.service_type || 'Oil Change',
      description: log.description || '',
      status: log.status || 'Pending',
      cost: log.cost ? log.cost.toString() : ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance log?')) return;
    try {
      const { error } = await supabaseClient
        .from('maintenance_logs')
        .delete()
        .eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['maintenanceLogs'] });
    } catch (err) {
      console.error('Error deleting log:', err);
      alert('Failed to delete the log. Please try again.');
    }
  };

  const handleNewClick = () => {
    setEditingLogId(null);
    setFormData({ vehicle_id: '', service_type: 'Oil Change', description: '', status: 'Pending', cost: '' });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <p className="text-muted-foreground mt-1 text-sm">Manage vehicle maintenance schedules, logs, and alerts.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={handleNewClick}
             className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0b0e14]"
           >
             <Plus className="mr-2 h-4 w-4" />
             New Request
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
                    <dt className="truncate text-sm font-medium text-slate-400">{item.name}</dt>
                    <dd className="mt-1 text-2xl font-bold tracking-tight text-white">{item.stat}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="rounded-xl bg-[#151923] border border-white/5 shadow-sm overflow-hidden">
         <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#11131a]">
            <div className="relative max-w-sm flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Search vehicles, types, descriptions..."
                className="block w-full rounded-lg border-0 py-2 pl-10 pr-3 text-white bg-[#1a2130] ring-1 ring-inset ring-white/10 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
               <div className="flex items-center gap-2 bg-[#1a2130] rounded-lg px-2 ring-1 ring-inset ring-white/10">
                 <Filter className="h-4 w-4 text-slate-400" />
                 <select 
                   value={statusFilter}
                   onChange={(e) => setStatusFilter(e.target.value)}
                   className="bg-transparent text-sm text-slate-300 outline-none py-2 focus:ring-0 border-none appearance-none cursor-pointer pr-4"
                 >
                   <option value="All">All Statuses</option>
                   <option value="Pending">Pending</option>
                   <option value="In Progress">In Progress</option>
                   <option value="Completed">Completed</option>
                   <option value="Critical">Critical</option>
                 </select>
               </div>
            </div>
         </div>
         <div className="overflow-x-auto">
            {isLoading ? (
               <div className="p-8 text-center text-slate-500">Loading maintenance data...</div>
            ) : isError ? (
               <div className="p-8 text-center text-red-500">Failed to load data. Please check your connection.</div>
            ) : filteredLogs.length === 0 ? (
               <div className="p-8 text-center text-slate-500">No maintenance logs found.</div>
            ) : (
            <table className="min-w-full divide-y divide-white/5">
              <thead className="bg-[#11131a]">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider sm:pl-6">Vehicle</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Service Type</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Scheduled Date</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Cost</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-[#151923]">
                {filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">
                        {log.vehicles?.make} {log.vehicles?.model} <span className="text-slate-500 block text-xs">({log.vehicles?.license_plate})</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-200">{log.service_type}</td>
                    <td className="px-3 py-4 text-sm text-slate-400 max-w-xs truncate">{log.description}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                       <span className={cn(
                         "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                         log.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                         log.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                         log.status === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                         'bg-amber-500/10 text-amber-500 border-amber-500/20'
                       )}>
                         {log.status}
                       </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">{new Date(log.scheduled_date).toLocaleDateString()}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-white">
                        {log.cost ? `₹${log.cost.toLocaleString()}` : '-'}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => handleEditClick(log)} className="text-blue-500 hover:text-blue-400 transition-colors">Edit</button>
                        <button onClick={() => handleDeleteClick(log.id)} className="text-red-500 hover:text-red-400 transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
         </div>
      </div>

      {/* New Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0e14]/80 backdrop-blur-sm">
          <div className="bg-[#151923] border border-white/10 rounded-xl shadow-2xl w-full max-w-md p-6 relative">
             <button 
               onClick={() => setIsModalOpen(false)}
               className="absolute top-4 right-4 text-slate-400 hover:text-white"
             >
                <X className="w-5 h-5" />
             </button>
             <h2 className="text-lg font-bold text-white mb-4">{editingLogId ? 'Edit Maintenance Log' : 'New Maintenance Request'}</h2>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Vehicle License Plate</label>
                  <select 
                    required 
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
                    className="w-full bg-[#11131a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                  >
                     <option value="" disabled>Select a vehicle</option>
                     {vehicleOptions.map((v: any) => (
                       <option key={v.id} value={v.id}>{v.license_plate}</option>
                     ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Service Type</label>
                  <select 
                    required 
                    value={formData.service_type}
                    onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                    className="w-full bg-[#11131a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                  >
                     <option value="Oil Change">Oil Change</option>
                     <option value="Brake Inspection">Brake Inspection</option>
                     <option value="Tire Replacement">Tire Replacement</option>
                     <option value="Engine Repair">Engine Repair</option>
                     <option value="Routine Service">Routine Service</option>
                     <option value="AC Repair">AC Repair</option>
                     <option value="Electrical Check">Electrical Check</option>
                     <option value="Transmission Overhaul">Transmission Overhaul</option>
                     <option value="Body Repair">Body Repair</option>
                     <option value="Battery Replacement">Battery Replacement</option>
                     <option value="Suspension Check">Suspension Check</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                  <textarea 
                    rows={3} 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-[#11131a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500" 
                    placeholder="Details about the issue..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Status / Priority</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-[#11131a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                  >
                     <option value="Pending">Pending (Low Priority)</option>
                     <option value="In Progress">In Progress</option>
                     <option value="Completed">Completed</option>
                     <option value="Critical">Critical (High Priority)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Estimated Cost (₹)</label>
                  <input 
                    type="number" 
                    value={formData.cost}
                    onChange={(e) => setFormData({...formData, cost: e.target.value})}
                    className="w-full bg-[#11131a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500" 
                    placeholder="e.g. 15000"
                  />
                </div>
                
                {submitError && (
                   <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] p-2 rounded flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {submitError}
                   </div>
                )}
                
                <div className="pt-2">
                   <button 
                     type="submit" 
                     disabled={isSubmitting}
                     className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2 transition-colors text-sm"
                   >
                      {isSubmitting ? 'Saving...' : (editingLogId ? 'Save Changes' : 'Submit Request')}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}

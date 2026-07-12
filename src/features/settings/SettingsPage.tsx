import { useState } from 'react';
import { Save, Check, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  
  const [generalSettings, setGeneralSettings] = useState({
    depotName: 'Gandhinagar Depot GJ4',
    currency: 'INR (Rs)',
    distanceUnit: 'Kilometers'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  };

  const rbacRoles = [
    { name: 'Fleet Manager', fleet: 'write', drivers: 'write', trips: 'none', fuel: 'none', analytics: 'write' },
    { name: 'Dispatcher', fleet: 'read', drivers: 'none', trips: 'write', fuel: 'none', analytics: 'none' },
    { name: 'Safety Officer', fleet: 'none', drivers: 'write', trips: 'read', fuel: 'none', analytics: 'none' },
    { name: 'Financial Analyst', fleet: 'read', drivers: 'none', trips: 'none', fuel: 'write', analytics: 'write' },
  ];

  const renderIcon = (permission: string) => {
    if (permission === 'write') return <Check className="w-4 h-4 text-emerald-500 mx-auto" />;
    if (permission === 'read') return <span className="text-xs text-blue-400 font-medium">View</span>;
    return <span className="text-slate-600">-</span>;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0e14] text-slate-200 p-6 overflow-auto custom-scrollbar pb-20">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
          <Shield className="w-6 h-6 mr-3 text-slate-400" /> System Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">Configure general preferences and role-based access control.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* General Settings */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#151923] border border-slate-700/50 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">General</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Depot Name</label>
                <input 
                  type="text" 
                  value={generalSettings.depotName}
                  onChange={(e) => setGeneralSettings({...generalSettings, depotName: e.target.value})}
                  className="w-full bg-[#0b0e14] border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Currency</label>
                <input 
                  type="text" 
                  value={generalSettings.currency}
                  onChange={(e) => setGeneralSettings({...generalSettings, currency: e.target.value})}
                  className="w-full bg-[#0b0e14] border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Distance Unit</label>
                <input 
                  type="text" 
                  value={generalSettings.distanceUnit}
                  onChange={(e) => setGeneralSettings({...generalSettings, distanceUnit: e.target.value})}
                  className="w-full bg-[#0b0e14] border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center min-w-[140px]"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* RBAC Settings */}
        <div className="lg:col-span-8">
          <div className="bg-[#151923] border border-slate-700/50 rounded-2xl p-6 shadow-sm h-full">
            <h2 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Role-Based Access (RBAC)</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-[#0b0e14] text-slate-500 font-bold border-b border-slate-700/50">
                  <tr>
                    <th className="px-4 py-4">Role</th>
                    <th className="px-4 py-4 text-center">Fleet</th>
                    <th className="px-4 py-4 text-center">Drivers</th>
                    <th className="px-4 py-4 text-center">Trips</th>
                    <th className="px-4 py-4 text-center">Fuel/Exp.</th>
                    <th className="px-4 py-4 text-center">Analytics</th>
                  </tr>
                </thead>
                <tbody>
                  {rbacRoles.map((role, idx) => (
                    <tr key={idx} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-4 font-medium text-white">{role.name}</td>
                      <td className="px-4 py-4 text-center">{renderIcon(role.fleet)}</td>
                      <td className="px-4 py-4 text-center">{renderIcon(role.drivers)}</td>
                      <td className="px-4 py-4 text-center">{renderIcon(role.trips)}</td>
                      <td className="px-4 py-4 text-center">{renderIcon(role.fuel)}</td>
                      <td className="px-4 py-4 text-center">{renderIcon(role.analytics)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start text-sm text-blue-400">
               <Shield className="w-5 h-5 mr-3 shrink-0" />
               <p>
                 Note: Your current role is <strong>{user?.role || 'Admin'}</strong>. RBAC changes made here apply globally to all users matching these roles. Contact support to define custom roles.
               </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

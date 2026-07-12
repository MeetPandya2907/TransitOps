import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateTrip, useVehicles, useDrivers } from '../hooks/useTrips'
import { useState } from 'react'
import { X, Loader2, Route } from 'lucide-react'

const createTripSchema = z.object({
  source: z.string().min(1, 'Source is required'),
  destination: z.string().min(1, 'Destination is required'),
  vehicle_id: z.string().uuid('Invalid vehicle'),
  driver_id: z.string().uuid('Invalid driver'),
  cargo_weight: z.number().positive('Must be positive'),
  planned_distance: z.number().positive('Must be positive'),
})

type CreateTripValues = z.infer<typeof createTripSchema>

export function CreateTripModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const createTrip = useCreateTrip()
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles()
  const { data: drivers, isLoading: driversLoading } = useDrivers()
  
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<CreateTripValues>({
    resolver: zodResolver(createTripSchema),
  })

  if (!isOpen) return null

  const onSubmit = async (data: CreateTripValues) => {
    try {
      setError(null)
      await createTrip.mutateAsync(data)
      reset()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create trip')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#151b2b] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-2 rounded-lg">
              <Route className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Create New Trip</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
               {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">Source Location</label>
              <input {...register('source')} className="w-full h-11 bg-[#0b0f19] border border-white/10 rounded-xl px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all" placeholder="e.g. New York, NY" />
              {errors.source && <p className="text-xs text-red-400 ml-1">{errors.source.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">Destination</label>
              <input {...register('destination')} className="w-full h-11 bg-[#0b0f19] border border-white/10 rounded-xl px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all" placeholder="e.g. Boston, MA" />
              {errors.destination && <p className="text-xs text-red-400 ml-1">{errors.destination.message}</p>}
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">Vehicle</label>
              <select {...register('vehicle_id')} className="w-full h-11 bg-[#0b0f19] border border-white/10 rounded-xl px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none" disabled={vehiclesLoading}>
                <option value="">Select a vehicle...</option>
                {vehicles?.map(v => (
                  <option key={v.id} value={v.id}>{v.registration_number} ({v.name_model})</option>
                ))}
              </select>
              {errors.vehicle_id && <p className="text-xs text-red-400 ml-1">{errors.vehicle_id.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">Driver</label>
              <select {...register('driver_id')} className="w-full h-11 bg-[#0b0f19] border border-white/10 rounded-xl px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none" disabled={driversLoading}>
                <option value="">Select a driver...</option>
                {drivers?.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {errors.driver_id && <p className="text-xs text-red-400 ml-1">{errors.driver_id.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">Cargo Weight (kg)</label>
              <input type="number" step="0.1" {...register('cargo_weight', { valueAsNumber: true })} className="w-full h-11 bg-[#0b0f19] border border-white/10 rounded-xl px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all" />
              {errors.cargo_weight && <p className="text-xs text-red-400 ml-1">{errors.cargo_weight.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">Planned Distance (km)</label>
              <input type="number" step="0.1" {...register('planned_distance', { valueAsNumber: true })} className="w-full h-11 bg-[#0b0f19] border border-white/10 rounded-xl px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all" />
              {errors.planned_distance && <p className="text-xs text-red-400 ml-1">{errors.planned_distance.message}</p>}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/5 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                 <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
              ) : 'Dispatch Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

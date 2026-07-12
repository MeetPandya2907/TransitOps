import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { useTrips, useUpdateTripStatus } from '../hooks/useTrips'
import type { Trip } from '../services/trip.service'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MapPin, Truck, User } from 'lucide-react'

const COLUMNS = ['draft', 'dispatched', 'completed', 'cancelled'] as const

export function TripBoard() {
  const { data: trips, isLoading } = useTrips()
  const updateStatus = useUpdateTripStatus()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return

    const tripId = active.id as string
    const newStatus = over.id as Trip['status']
    
    const trip = trips?.find(t => t.id === tripId)
    if (trip && trip.status !== newStatus) {
      if (newStatus === 'completed' && trip.status === 'dispatched') {
        const odometer = prompt('Enter final odometer:')
        const fuel = prompt('Enter fuel consumed:')
        if (odometer && fuel) {
           updateStatus.mutate({ 
             id: tripId, 
             status: newStatus,
             updates: { final_odometer: Number(odometer), fuel_consumed: Number(fuel) }
           })
        }
      } else {
        updateStatus.mutate({ id: tripId, status: newStatus })
      }
    }
  }

  if (isLoading) return <div className="text-white">Loading trips...</div>

  // Group trips by status
  const tripsByStatus = COLUMNS.reduce((acc, status) => {
    acc[status] = trips?.filter(t => t.status === status) || []
    return acc
  }, {} as Record<string, any[]>)

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-6 overflow-x-auto pb-4 custom-scrollbar">
        {COLUMNS.map(column => (
          <Column key={column} title={column} trips={tripsByStatus[column]} />
        ))}
      </div>
    </DndContext>
  )
}

function Column({ title, trips }: { title: string, trips: any[] }) {
  const { setNodeRef } = useDroppable({ id: title })

  return (
    <div className="flex flex-col flex-1 min-w-[320px] max-w-[400px] bg-[#151b2b] rounded-xl border border-white/5 flex-shrink-0">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-semibold text-slate-200 capitalize">{title}</h3>
        <span className="bg-white/10 text-slate-300 text-xs py-1 px-2.5 rounded-full font-medium">
          {trips.length}
        </span>
      </div>
      
      <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 min-h-[200px] custom-scrollbar">
        {trips.map(trip => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </div>
  )
}

function TripCard({ trip }: { trip: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: trip.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-[#1e273a] p-5 rounded-xl border border-white/5 shadow-lg cursor-grab active:cursor-grabbing hover:border-indigo-500/30 transition-colors group relative overflow-hidden"
    >
      {/* Accent bar indicating status */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
        trip.status === 'draft' ? 'bg-slate-500' :
        trip.status === 'dispatched' ? 'bg-blue-500' :
        trip.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
      }`} />

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <span className="text-indigo-400">#{trip.id.substring(0, 6).toUpperCase()}</span>
        </div>
        <span className="text-xs text-slate-500 font-medium">{trip.planned_distance} km</span>
      </div>
      
      <div className="space-y-3 mb-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 bg-white/5 p-1.5 rounded-md">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-200">{trip.source}</span>
            <span className="text-xs text-slate-500 mt-0.5">to {trip.destination}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5 text-xs font-medium pt-3 border-t border-white/5">
        <div className="flex items-center gap-2 text-slate-300">
          <Truck className="w-4 h-4 text-slate-500" />
          {trip.vehicles?.registration_number || 'N/A'}
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <User className="w-4 h-4 text-slate-500" />
          {trip.drivers?.name || 'N/A'}
        </div>
      </div>
    </div>
  )
}

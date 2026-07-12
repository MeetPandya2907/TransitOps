import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MapPin, Truck, User, Package, ArrowRight } from 'lucide-react'
import { useTrips, useUpdateTripStatus } from '../hooks/useTrips'
import type { Trip } from '../services/trip.service'
import { useAuthStore } from '@/store/authStore'

const COLUMNS: { id: Trip['status']; label: string; color: string; dot: string }[] = [
  { id: 'draft',      label: 'Draft',      color: 'border-slate-500/30',  dot: 'bg-slate-400'   },
  { id: 'dispatched', label: 'Dispatched', color: 'border-blue-500/30',   dot: 'bg-blue-400'    },
  { id: 'completed',  label: 'Completed',  color: 'border-emerald-500/30',dot: 'bg-emerald-400' },
  { id: 'cancelled',  label: 'Cancelled',  color: 'border-red-500/30',    dot: 'bg-red-400'     },
]

export function TripBoard() {
  const { data: trips, isLoading, error } = useTrips()
  const updateStatus = useUpdateTripStatus()
  const { profile } = useAuthStore()
  const isFleetManager = profile?.roles?.includes('FleetManager')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isFleetManager) return // Only FleetManagers can drag

    const { active, over } = event
    if (!over) return

    const tripId = active.id as string
    const newStatus = over.id as Trip['status']
    const trip = trips?.find(t => t.id === tripId)

    if (!trip || trip.status === newStatus) return

    // Enforce valid transitions only
    const validTransitions: Record<Trip['status'], Trip['status'][]> = {
      draft:      ['dispatched', 'cancelled'],
      dispatched: ['completed', 'cancelled'],
      completed:  [],
      cancelled:  [],
    }

    if (!validTransitions[trip.status].includes(newStatus)) {
      alert(`Cannot move trip from "${trip.status}" to "${newStatus}".`)
      return
    }

    if (newStatus === 'completed') {
      const odometer = prompt('Enter final odometer reading (km):')
      const fuel = prompt('Enter fuel consumed (liters):')
      if (!odometer || !fuel) return
      updateStatus.mutate({
        id: tripId,
        status: newStatus,
        updates: {
          final_odometer: Number(odometer),
          fuel_consumed: Number(fuel),
        }
      })
    } else {
      updateStatus.mutate({ id: tripId, status: newStatus })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          Loading trips...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-red-400 text-sm">Failed to load trips. Check your Supabase connection.</p>
      </div>
    )
  }

  const tripsByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = trips?.filter(t => t.status === col.id) ?? []
    return acc
  }, {} as Record<string, any[]>)

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-5 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
        {COLUMNS.map(col => (
          <Column
            key={col.id}
            column={col}
            trips={tripsByStatus[col.id]}
            canDrag={!!isFleetManager}
          />
        ))}
      </div>
    </DndContext>
  )
}

function Column({ column, trips, canDrag }: {
  column: typeof COLUMNS[number]
  trips: any[]
  canDrag: boolean
}) {
  const { setNodeRef } = useDroppable({ id: column.id })

  return (
    <div className={`flex flex-col flex-1 min-w-[300px] max-w-[380px] bg-[#151b2b] rounded-2xl border ${column.color} flex-shrink-0 overflow-hidden`}>
      {/* Column Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${column.dot}`} />
          <h3 className="font-semibold text-slate-200 text-sm capitalize">{column.label}</h3>
        </div>
        <span className="bg-white/5 text-slate-400 text-xs py-1 px-2.5 rounded-full font-medium tabular-nums">
          {trips.length}
        </span>
      </div>

      {/* Cards Drop Zone */}
      <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 min-h-[80px]" style={{ scrollbarWidth: 'thin' }}>
        <SortableContext items={trips.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {trips.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-600 text-xs font-medium py-8">
              No trips
            </div>
          ) : (
            trips.map(trip => (
              <TripCard key={trip.id} trip={trip} canDrag={canDrag} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}

function TripCard({ trip, canDrag }: { trip: any; canDrag: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: trip.id,
    disabled: !canDrag,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const barColor: Record<string, string> = {
    draft: 'bg-slate-500',
    dispatched: 'bg-blue-500',
    completed: 'bg-emerald-500',
    cancelled: 'bg-red-500',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(canDrag ? listeners : {})}
      className={`bg-[#1c2437] p-4 rounded-xl border border-white/5 shadow-md relative overflow-hidden transition-colors ${
        canDrag ? 'cursor-grab active:cursor-grabbing hover:border-indigo-500/30' : 'cursor-default'
      }`}
    >
      {/* Left status bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${barColor[trip.status]}`} />

      {/* Trip ID + Distance */}
      <div className="flex items-center justify-between mb-3 pl-2">
        <span className="text-xs font-mono font-bold text-indigo-400">
          #{trip.id.substring(0, 8).toUpperCase()}
        </span>
        <span className="text-xs text-slate-500 tabular-nums">{trip.planned_distance} km</span>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 pl-2 mb-3">
        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <div className="flex items-center gap-1.5 text-sm min-w-0">
          <span className="font-semibold text-slate-200 truncate">{trip.source}</span>
          <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
          <span className="text-slate-400 truncate">{trip.destination}</span>
        </div>
      </div>

      {/* Cargo weight */}
      <div className="flex items-center gap-2 pl-2 mb-3">
        <Package className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span className="text-xs text-slate-400">{trip.cargo_weight} kg cargo</span>
      </div>

      {/* Vehicle + Driver */}
      <div className="flex items-center gap-4 pl-2 pt-3 border-t border-white/5 text-xs font-medium">
        <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
          <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{trip.vehicles?.registration_number ?? '—'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{trip.drivers?.name ?? '—'}</span>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from "react";
import type { Trip, TripStatus } from "@/lib/tripData";
import { TripCard } from "./TripCard";
import { cn } from "@/lib/utils";
import { useSupabaseUpdate, useSupabaseDelete } from "@/lib/useSupabaseMutation";

interface KanbanBoardProps {
  initialTrips: Trip[];
}

export function KanbanBoard({ initialTrips }: KanbanBoardProps) {
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const updateMutation = useSupabaseUpdate<Trip>('trips');
  const deleteMutation = useSupabaseDelete<Trip>('trips');

  // Sync with prop changes (e.g. from cache updates or inserts)
  useEffect(() => {
    setTrips(initialTrips);
  }, [initialTrips]);

  const handleStatusChange = async (id: string, newStatus: TripStatus) => {
    // Optimistic UI update locally
    setTrips(trips.map(trip => 
      trip.id === id ? { ...trip, status: newStatus } : trip
    ));
    // Persist to Supabase
    await updateMutation.mutateAsync({ id, status: newStatus });
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const columns: { title: TripStatus; indicator: string }[] = [
    { title: 'Draft', indicator: 'bg-muted-foreground' },
    { title: 'Dispatched', indicator: 'bg-blue-500' },
    { title: 'In Transit', indicator: 'bg-amber-500' },
    { title: 'Completed', indicator: 'bg-emerald-500' },
  ];

  return (
    <div className="flex gap-6 h-[calc(100vh-14rem)] min-h-[500px] overflow-x-auto pb-6 px-1 custom-scrollbar">
      {columns.map(column => {
        const columnTrips = trips.filter(t => t.status === column.title);
        
        return (
          <div key={column.title} className="flex flex-col min-w-[320px] max-w-[320px] w-[320px] flex-shrink-0 bg-muted/40 rounded-xl border shadow-sm">
            {/* Column Header */}
            <div className="p-4 border-b bg-card rounded-t-xl flex items-center justify-between sticky top-0 z-20">
              <div className="flex items-center gap-2.5">
                <div className={cn("h-2.5 w-2.5 rounded-full", column.indicator)} />
                <h3 className="font-bold tracking-tight">{column.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-secondary text-secondary-foreground ml-1">
                  {columnTrips.length}
                </span>
              </div>
            </div>
            
            {/* Column Body */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
              {columnTrips.map(trip => (
                <TripCard 
                  key={trip.id} 
                  trip={trip} 
                  onStatusChange={handleStatusChange} 
                  onDelete={handleDelete}
                />
              ))}
              {columnTrips.length === 0 && (
                <div className="h-24 mt-2 flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg text-muted-foreground text-sm font-medium">
                  Drop trips here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

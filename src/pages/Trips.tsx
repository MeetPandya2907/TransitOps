import { Plus, Route as RouteIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KanbanBoard } from "@/features/trips/components/KanbanBoard";
import { mockTrips } from "@/lib/tripData";
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useSupabaseQuery } from "@/lib/useSupabaseQuery";
import { useSupabaseInsert } from "@/lib/useSupabaseMutation";
import type { Trip } from "@/lib/tripData";

export default function TripsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: trips, isLoading } = useSupabaseQuery<Trip>('trips', mockTrips);
  const insertMutation = useSupabaseInsert<Trip>('trips');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTrip, setNewTrip] = useState({ origin: '', destination: '', vehicleId: '', driverName: '' });

  // Re-filter trips if search term changes
  const filteredTrips = (trips || []).filter(trip => 
    trip.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    trip.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.driverName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrip.origin || !newTrip.destination) return;

    await insertMutation.mutateAsync({
      origin: newTrip.origin,
      destination: newTrip.destination,
      vehicleId: newTrip.vehicleId || 'Unassigned',
      driverName: newTrip.driverName || 'Unassigned',
      status: 'Pending',
      distance: 0,
      eta: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    } as any);

    setIsAddModalOpen(false);
    setNewTrip({ origin: '', destination: '', vehicleId: '', driverName: '' });
  };

  return (
    <div className="flex-1 space-y-6 flex flex-col h-full pb-10">
      <PageHeader
        title="Trip Dispatch"
        description="Manage active routes, dispatch drivers, and monitor delivery ETA."
        actions={
          <>
            <Button variant="outline" className="shadow-sm bg-card">
              <RouteIcon className="mr-2 h-4 w-4" />
              Route Optimizer
            </Button>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="mr-2 h-4 w-4" />
                  New Trip
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Trip</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddTrip}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="origin">Origin</Label>
                      <Input 
                        id="origin" 
                        value={newTrip.origin}
                        onChange={e => setNewTrip(p => ({ ...p, origin: e.target.value }))}
                        placeholder="e.g. Surat, Gujarat" 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="destination">Destination</Label>
                      <Input 
                        id="destination" 
                        value={newTrip.destination}
                        onChange={e => setNewTrip(p => ({ ...p, destination: e.target.value }))}
                        placeholder="e.g. Mumbai, Maharashtra" 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="vehicle">Assign Vehicle</Label>
                      <Input 
                        id="vehicle" 
                        value={newTrip.vehicleId}
                        onChange={e => setNewTrip(p => ({ ...p, vehicleId: e.target.value }))}
                        placeholder="Select vehicle..." 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="driver">Assign Driver</Label>
                      <Input 
                        id="driver" 
                        value={newTrip.driverName}
                        onChange={e => setNewTrip(p => ({ ...p, driverName: e.target.value }))}
                        placeholder="Select driver..." 
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={insertMutation.isPending}>
                      {insertMutation.isPending ? 'Saving...' : 'Create Trip'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="px-6 sm:px-8 flex-1 min-h-0 flex flex-col">
        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 mb-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search trips by ID, location, or driver..." 
              className="pl-9 bg-card shadow-sm h-10 border-white/[0.06]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 min-h-0 w-full mt-2">
          {isLoading ? (
            <div className="h-full w-full rounded-xl bg-card/30 border border-white/[0.06] animate-pulse flex items-center justify-center">
              <span className="text-muted-foreground">Loading trips...</span>
            </div>
          ) : (
            <KanbanBoard initialTrips={filteredTrips} />
          )}
        </div>
      </div>
    </div>
  );
}

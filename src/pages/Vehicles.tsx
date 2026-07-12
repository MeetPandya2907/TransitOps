import { Plus, Download, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehicleDataTable } from "@/features/vehicles/components/VehicleDataTable";
import { useSupabaseQuery } from "@/lib/useSupabaseQuery";
import { useSupabaseInsert } from "@/lib/useSupabaseMutation";
import { mockVehicles } from "@/lib/mockData";
import { PageHeader } from "@/components/ui/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import type { Vehicle } from "@/lib/types";

export default function VehiclesPage() {
  const { data: vehicles, isLoading } = useSupabaseQuery<Vehicle>('vehicles', mockVehicles);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ make: '', model: '', licensePlate: '' });
  
  const insertMutation = useSupabaseInsert<Vehicle>('vehicles');

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.make || !newVehicle.model || !newVehicle.licensePlate) return;
    
    // We map to the frontend Vehicle type. When Supabase is configured, 
    // a proper mapping to DB snake_case would be needed in the mutation or API layer.
    await insertMutation.mutateAsync({
      make: newVehicle.make,
      model: newVehicle.model,
      year: new Date().getFullYear(),
      licensePlate: newVehicle.licensePlate,
      status: 'Active',
      mileage: 0,
      fuelEfficiency: 0,
      lastMaintenance: new Date().toISOString(),
    } as any);
    
    setIsAddModalOpen(false);
    setNewVehicle({ make: '', model: '', licensePlate: '' });
  };

  const handleDelete = async (vehicle: Vehicle) => {
    // We will implement delete later in the data table
  };

  // We can pass a callback to the table to open the sheet
  const handleViewDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  return (
    <div className="flex-1 space-y-6 pb-10">
      <PageHeader
        title="Fleet Vehicles"
        description="Manage, monitor, and update your entire fleet."
        actions={
          <>
            <Button variant="outline" className="shadow-sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vehicle
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Vehicle</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddVehicle}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="make">Make</Label>
                      <Input 
                        id="make" 
                        value={newVehicle.make}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, make: e.target.value }))}
                        placeholder="e.g. Volvo" 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="model">Model</Label>
                      <Input 
                        id="model" 
                        value={newVehicle.model}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, model: e.target.value }))}
                        placeholder="e.g. VNL 860" 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="plate">License Plate</Label>
                      <Input 
                        id="plate" 
                        value={newVehicle.licensePlate}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, licensePlate: e.target.value }))}
                        placeholder="e.g. GJ05 AB 1234" 
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={insertMutation.isPending}>
                      {insertMutation.isPending ? 'Saving...' : 'Save Vehicle'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </>
        }
      />
      
      <div className="px-6 sm:px-8 flex flex-col gap-8">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center border border-white/[0.06] rounded-xl bg-card/30 animate-pulse">
            <span className="text-muted-foreground">Loading vehicles...</span>
          </div>
        ) : (
          <VehicleDataTable data={vehicles || []} />
        )}
      </div>

      <Sheet open={!!selectedVehicle} onOpenChange={(open) => !open && setSelectedVehicle(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Vehicle Details</SheetTitle>
          </SheetHeader>
          {selectedVehicle && (
            <div className="py-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                  <Truck size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedVehicle.make} {selectedVehicle.model}</h3>
                  <div className="font-mono text-sm text-muted-foreground mt-1 bg-white/5 inline-block px-2 py-0.5 rounded border border-white/10">
                    {selectedVehicle.licensePlate}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <p className="font-medium">{selectedVehicle.status}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Assigned Driver</span>
                  <p className="font-medium">{selectedVehicle.assignedDriver || 'Unassigned'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Mileage</span>
                  <p className="font-medium">{selectedVehicle.mileage} mi</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Fuel Efficiency</span>
                  <p className="font-medium">{selectedVehicle.fuelEfficiency} MPG</p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

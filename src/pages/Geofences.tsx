import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Map, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSupabaseQuery } from "@/lib/useSupabaseQuery";
import { useSupabaseInsert, useSupabaseDelete } from "@/lib/useSupabaseMutation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Geofence {
  id: string;
  name: string;
  radius: number;
  location: string;
}

const mockGeofences: Geofence[] = [
  { id: 'GF-001', name: 'Mumbai Warehouse', radius: 5, location: 'Mumbai, MH' }
];

export default function GeofencesPage() {
  const { data: geofencesData, isLoading } = useSupabaseQuery<Geofence>('geofences', mockGeofences);
  const insertMutation = useSupabaseInsert<Geofence>('geofences');
  const deleteMutation = useSupabaseDelete<Geofence>('geofences');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGeofence, setNewGeofence] = useState({ name: '', radius: '', location: '' });

  const handleAddGeofence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGeofence.name || !newGeofence.location) return;

    await insertMutation.mutateAsync({
      name: newGeofence.name,
      radius: Number(newGeofence.radius) || 1,
      location: newGeofence.location,
    } as any);

    setIsAddModalOpen(false);
    setNewGeofence({ name: '', radius: '', location: '' });
  };

  const geofences = geofencesData || [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto pb-10">
      <PageHeader 
        title="Geofences" 
        description="Create and manage virtual boundaries."
        actions={
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Create Geofence
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>New Geofence</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddGeofence}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Geofence Name</Label>
                    <Input 
                      id="name" 
                      value={newGeofence.name}
                      onChange={e => setNewGeofence(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Surat HQ" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location / Coordinates</Label>
                    <Input 
                      id="location" 
                      value={newGeofence.location}
                      onChange={e => setNewGeofence(p => ({ ...p, location: e.target.value }))}
                      placeholder="e.g. Surat, GJ" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="radius">Radius (km)</Label>
                    <Input 
                      id="radius" 
                      type="number"
                      value={newGeofence.radius}
                      onChange={e => setNewGeofence(p => ({ ...p, radius: e.target.value }))}
                      placeholder="e.g. 10" 
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={insertMutation.isPending}>
                    {insertMutation.isPending ? 'Saving...' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="p-6 sm:p-8 pt-0">
        {isLoading ? (
          <div className="h-32 border border-white/[0.06] rounded-xl bg-card/30 animate-pulse flex items-center justify-center">
            <span className="text-muted-foreground">Loading geofences...</span>
          </div>
        ) : geofences.length === 0 ? (
          <EmptyState 
            icon={Map}
            title="No geofences created"
            description="Create virtual perimeters for real-world geographic areas to trigger alerts when vehicles enter or exit."
            actionLabel="Create Geofence"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {geofences.map(geofence => (
              <Card key={geofence.id} className="bg-card hover:shadow-md transition-shadow group">
                <CardContent className="p-5 flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-lg">{geofence.name}</span>
                    <div className="text-sm text-muted-foreground">
                      {geofence.location} • {geofence.radius} km radius
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity"
                    onClick={() => {
                      if(confirm('Delete this geofence?')) deleteMutation.mutate(geofence.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Droplets, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSupabaseQuery } from "@/lib/useSupabaseQuery";
import { useSupabaseInsert, useSupabaseDelete } from "@/lib/useSupabaseMutation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface FuelLog {
  id: string;
  vehicleId: string;
  liters: number;
  cost: number;
  date: string;
}

const mockFuelLogs: FuelLog[] = [
  { id: 'FL-001', vehicleId: 'V-1001', liters: 50, cost: 4500, date: '2023-10-25' }
];

export default function FuelExpensesPage() {
  const { data: fuelLogs, isLoading } = useSupabaseQuery<FuelLog>('fuel_logs', mockFuelLogs);
  const insertMutation = useSupabaseInsert<FuelLog>('fuel_logs');
  const deleteMutation = useSupabaseDelete<FuelLog>('fuel_logs');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLog, setNewLog] = useState({ vehicleId: '', liters: '', cost: '', date: '' });

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.vehicleId || !newLog.liters || !newLog.cost) return;

    await insertMutation.mutateAsync({
      vehicleId: newLog.vehicleId,
      liters: Number(newLog.liters),
      cost: Number(newLog.cost),
      date: newLog.date || new Date().toISOString().split('T')[0],
    } as any);

    setIsAddModalOpen(false);
    setNewLog({ vehicleId: '', liters: '', cost: '', date: '' });
  };

  const logs = fuelLogs || [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto pb-10">
      <PageHeader 
        title="Fuel & Expenses" 
        description="Monitor fuel consumption and manage operational expenses."
        actions={
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Fuel Log
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Fuel Log</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddLog}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="vehicle">Vehicle ID</Label>
                    <Input 
                      id="vehicle" 
                      value={newLog.vehicleId}
                      onChange={e => setNewLog(p => ({ ...p, vehicleId: e.target.value }))}
                      placeholder="e.g. V-1001" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="liters">Liters</Label>
                      <Input 
                        id="liters" 
                        type="number"
                        value={newLog.liters}
                        onChange={e => setNewLog(p => ({ ...p, liters: e.target.value }))}
                        placeholder="e.g. 50" 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cost">Cost (₹)</Label>
                      <Input 
                        id="cost" 
                        type="number"
                        value={newLog.cost}
                        onChange={e => setNewLog(p => ({ ...p, cost: e.target.value }))}
                        placeholder="e.g. 4500" 
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={newLog.date}
                      onChange={e => setNewLog(p => ({ ...p, date: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={insertMutation.isPending}>
                    {insertMutation.isPending ? 'Saving...' : 'Add Log'}
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
            <span className="text-muted-foreground">Loading fuel logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <EmptyState 
            icon={Droplets}
            title="No fuel logs found"
            description="Start tracking your fuel expenses to get insights on consumption and costs."
            actionLabel="Add Fuel Log"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {logs.map(log => (
              <Card key={log.id} className="bg-card hover:shadow-md transition-shadow group">
                <CardContent className="p-5 flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-lg">{log.vehicleId}</span>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="font-medium text-foreground">{log.liters} L</span>
                      <span>•</span>
                      <span className="font-medium text-foreground">₹{log.cost}</span>
                      <span>•</span>
                      <span>{log.date}</span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity"
                    onClick={() => {
                      if(confirm('Delete this log?')) deleteMutation.mutate(log.id);
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

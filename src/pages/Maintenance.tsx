import { Plus, Download, Wrench, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaintenanceDataTable } from "@/features/maintenance/components/MaintenanceDataTable";
import { mockWorkOrders } from "@/lib/maintenanceData";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useSupabaseQuery } from "@/lib/useSupabaseQuery";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useSupabaseInsert } from "@/lib/useSupabaseMutation";
import type { WorkOrder } from "@/lib/maintenanceData";

export default function MaintenancePage() {
  const { data: workOrders, isLoading } = useSupabaseQuery<WorkOrder>('work_orders', mockWorkOrders);
  const insertMutation = useSupabaseInsert<WorkOrder>('work_orders');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({ vehicleId: '', serviceType: '', scheduledDate: '' });

  const safeWorkOrders = workOrders || [];
  const overdueCount = safeWorkOrders.filter(w => w.status === 'Overdue').length;
  const inProgressCount = safeWorkOrders.filter(w => w.status === 'In Progress').length;
  const upcomingCount = safeWorkOrders.filter(w => w.status === 'Upcoming').length;

  const handleAddWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.vehicleId || !newOrder.serviceType || !newOrder.scheduledDate) return;

    await insertMutation.mutateAsync({
      vehicleId: newOrder.vehicleId,
      serviceType: newOrder.serviceType,
      status: 'Upcoming',
      priority: 'Medium',
      scheduledDate: newOrder.scheduledDate,
      estimatedCost: 0,
      assignedMechanic: 'Unassigned',
      notes: '',
    } as any);

    setIsAddModalOpen(false);
    setNewOrder({ vehicleId: '', serviceType: '', scheduledDate: '' });
  };

  return (
    <div className="flex-1 space-y-6 pb-10">
      <PageHeader
        title="Maintenance"
        description="Manage work orders, schedule repairs, and track service history."
        actions={
          <>
            <Button variant="outline" className="shadow-sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="mr-2 h-4 w-4" />
                  New Work Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create Work Order</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddWorkOrder}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="vehicle">Vehicle</Label>
                      <Input 
                        id="vehicle" 
                        value={newOrder.vehicleId}
                        onChange={e => setNewOrder(p => ({ ...p, vehicleId: e.target.value }))}
                        placeholder="Select vehicle..." 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="service">Service Type</Label>
                      <Input 
                        id="service" 
                        value={newOrder.serviceType}
                        onChange={e => setNewOrder(p => ({ ...p, serviceType: e.target.value }))}
                        placeholder="e.g. Oil Change, Brake Inspection" 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="date">Scheduled Date</Label>
                      <Input 
                        id="date" 
                        type="date" 
                        value={newOrder.scheduledDate}
                        onChange={e => setNewOrder(p => ({ ...p, scheduledDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={insertMutation.isPending}>
                      {insertMutation.isPending ? 'Saving...' : 'Create Order'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="px-6 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-card shadow-sm border-white/[0.06] glass">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Overdue</span>
                <span className="text-2xl font-bold text-destructive">
                  <AnimatedCounter value={overdueCount} />
                </span>
              </div>
              <div className="h-10 w-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card shadow-sm border-white/[0.06] glass">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">In Progress</span>
                <span className="text-2xl font-bold text-blue-500">
                  <AnimatedCounter value={inProgressCount} />
                </span>
              </div>
              <div className="h-10 w-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Wrench className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card shadow-sm border-white/[0.06] glass">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</span>
                <span className="text-2xl font-bold text-foreground">
                  <AnimatedCounter value={upcomingCount} />
                </span>
              </div>
              <div className="h-10 w-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex flex-col gap-8">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center border border-white/[0.06] rounded-xl bg-card/30 animate-pulse">
              <span className="text-muted-foreground">Loading work orders...</span>
            </div>
          ) : (
            <MaintenanceDataTable data={safeWorkOrders} />
          )}
        </div>
      </div>
    </div>
  );
}

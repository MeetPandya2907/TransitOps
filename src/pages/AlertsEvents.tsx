import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Bell, Filter, Plus, Trash2, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSupabaseQuery } from "@/lib/useSupabaseQuery";
import { useSupabaseInsert, useSupabaseDelete } from "@/lib/useSupabaseMutation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Alert {
  id: string;
  title: string;
  severity: 'Info' | 'Warning' | 'Critical';
  date: string;
}

const mockAlerts: Alert[] = [
  { id: 'AL-001', title: 'Vehicle V-1002 entered restricted zone', severity: 'Warning', date: '2023-10-25T10:30:00Z' },
  { id: 'AL-002', title: 'Engine coolant low on V-1005', severity: 'Critical', date: '2023-10-25T09:15:00Z' }
];

export default function AlertsEventsPage() {
  const { data: alertsData, isLoading } = useSupabaseQuery<Alert>('alerts', mockAlerts);
  const insertMutation = useSupabaseInsert<Alert>('alerts');
  const deleteMutation = useSupabaseDelete<Alert>('alerts');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({ title: '', severity: 'Info' });

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlert.title) return;

    await insertMutation.mutateAsync({
      title: newAlert.title,
      severity: newAlert.severity,
      date: new Date().toISOString(),
    } as any);

    setIsAddModalOpen(false);
    setNewAlert({ title: '', severity: 'Info' });
  };

  const alerts = alertsData || [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto pb-10">
      <PageHeader 
        title="Alerts & Events" 
        description="Monitor system alerts and fleet events."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="border-white/[0.06]">
              <Filter className="mr-2 h-4 w-4" />
              Filter Alerts
            </Button>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  New Alert
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create Custom Alert</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddAlert}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Alert Message</Label>
                      <Input 
                        id="title" 
                        value={newAlert.title}
                        onChange={e => setNewAlert(p => ({ ...p, title: e.target.value }))}
                        placeholder="e.g. Speed limit exceeded" 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="severity">Severity (Info, Warning, Critical)</Label>
                      <Input 
                        id="severity" 
                        value={newAlert.severity}
                        onChange={e => setNewAlert(p => ({ ...p, severity: e.target.value as any }))}
                        placeholder="e.g. Warning" 
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={insertMutation.isPending}>
                      {insertMutation.isPending ? 'Saving...' : 'Add Alert'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      <div className="p-6 sm:p-8 pt-0">
        {isLoading ? (
          <div className="h-32 border border-white/[0.06] rounded-xl bg-card/30 animate-pulse flex items-center justify-center">
            <span className="text-muted-foreground">Loading alerts...</span>
          </div>
        ) : alerts.length === 0 ? (
          <EmptyState 
            icon={Bell}
            title="No recent alerts"
            description="Your fleet is running smoothly. Any critical alerts or events will appear here."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {alerts.map(alert => (
              <Card key={alert.id} className="bg-card hover:shadow-md transition-shadow group">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                      alert.severity === 'Critical' ? 'bg-destructive/10 text-destructive' :
                      alert.severity === 'Warning' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {alert.severity === 'Info' ? <Info className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base">{alert.title}</span>
                        <Badge variant="outline" className={
                          alert.severity === 'Critical' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                          alert.severity === 'Warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }>
                          {alert.severity}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(alert.date).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity"
                    onClick={() => {
                      if(confirm('Dismiss this alert?')) deleteMutation.mutate(alert.id);
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

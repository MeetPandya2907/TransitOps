import { CheckCircle2, AlertTriangle, Truck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    title: "Trip #TR-8924 completed",
    description: "Driver John Doe arrived at destination facility in Seattle, WA.",
    time: "10 mins ago",
    icon: CheckCircle2,
    iconBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    iconColor: "text-emerald-500",
  },
  {
    id: 2,
    title: "Maintenance alert on Vehicle V-104",
    description: "Engine temperature exceeded normal threshold during transit.",
    time: "45 mins ago",
    icon: AlertTriangle,
    iconBg: "bg-destructive/10 text-destructive border-destructive/20",
    iconColor: "text-destructive",
  },
  {
    id: 3,
    title: "New vehicle dispatched",
    description: "Vehicle V-219 assigned to route #RT-402 (Chicago -> Detroit).",
    time: "2 hours ago",
    icon: Truck,
    iconBg: "bg-primary/10 text-primary border-primary/20",
    iconColor: "text-primary",
  },
  {
    id: 4,
    title: "Route deviation detected",
    description: "Vehicle V-088 deviated from planned route by 15 miles.",
    time: "4 hours ago",
    icon: MapPin,
    iconBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    iconColor: "text-amber-500",
  },
];

export default function ActivityTimeline() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-1">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">Latest fleet events and alerts</p>
      </div>
      
      <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:via-border before:to-transparent">
        {activities.map((item) => (
          <div key={item.id} className="relative flex items-start gap-4 group">
            <div className={cn("absolute left-0 mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border bg-background z-10 transition-transform group-hover:scale-110", item.iconBg)}>
              <item.icon className={cn("h-4 w-4", item.iconColor)} />
            </div>
            <div className="ml-14 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-snug">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { ArrowDownIcon, ArrowUpIcon, Activity, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  {
    name: "Fleet Utilization",
    value: "87.4%",
    change: "+2.5%",
    changeType: "positive",
    icon: Activity,
  },
  {
    name: "Active Trips",
    value: "1,245",
    change: "+12.1%",
    changeType: "positive",
    icon: TrendingUp,
  },
  {
    name: "Critical Alerts",
    value: "4",
    change: "-2",
    changeType: "positive", // A decrease in critical alerts is positive
    icon: AlertTriangle,
  },
  {
    name: "Fleet Health Score",
    value: "94%",
    change: "+1.2%",
    changeType: "positive",
    icon: CheckCircle2,
  },
];

export default function KpiCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((item) => (
        <div
          key={item.name}
          className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-soft hover:-translate-y-1 group"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{item.name}</p>
            <div className="p-2 bg-secondary/50 rounded-lg group-hover:bg-primary/10 transition-colors">
              <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">{item.value}</h2>
            <div
              className={cn(
                "flex items-center text-xs font-semibold px-2 py-0.5 rounded-full transition-colors",
                item.changeType === "positive" 
                  ? "text-emerald-700 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20" 
                  : "text-destructive bg-destructive/10 dark:text-red-400 dark:bg-red-500/20"
              )}
            >
              {item.changeType === "positive" ? (
                <ArrowUpIcon className="mr-1 h-3 w-3" />
              ) : (
                <ArrowDownIcon className="mr-1 h-3 w-3" />
              )}
              {item.change.replace(/[+-]/, '')}
            </div>
          </div>
          {/* Subtle gradient background for premium feel */}
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />
        </div>
      ))}
    </div>
  );
}

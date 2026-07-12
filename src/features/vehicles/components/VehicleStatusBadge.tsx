import { cn } from "@/lib/utils";
import type { VehicleStatus } from "@/lib/types";
import { CheckCircle2, Wrench, AlertCircle, Clock } from "lucide-react";

interface VehicleStatusBadgeProps {
  status: VehicleStatus;
  className?: string;
}

export function VehicleStatusBadge({ status, className }: VehicleStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "Active":
        return {
          icon: CheckCircle2,
          classes: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
        };
      case "Maintenance":
        return {
          icon: Wrench,
          classes: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
        };
      case "Out of Service":
        return {
          icon: AlertCircle,
          classes: "bg-destructive/10 text-destructive border-destructive/20",
        };
      case "Idle":
        return {
          icon: Clock,
          classes: "bg-muted text-muted-foreground border-border",
        };
      default:
        return {
          icon: Clock,
          classes: "bg-muted text-muted-foreground border-border",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        config.classes,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {status}
    </div>
  );
}

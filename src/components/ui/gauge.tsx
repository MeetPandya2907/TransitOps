import { cn } from "@/lib/utils";

interface GaugeProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
}

export function Gauge({
  value,
  size = 64,
  strokeWidth = 6,
  className,
  showValue = true,
}: GaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  let colorClass = "text-emerald-500 dark:text-emerald-400";
  if (value < 75) colorClass = "text-destructive dark:text-red-400";
  else if (value < 90) colorClass = "text-amber-500 dark:text-amber-400";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background track */}
        <circle
          className="text-muted stroke-current"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress indicator */}
        <circle
          className={cn("stroke-current transition-all duration-1000 ease-in-out", colorClass)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {showValue && (
        <span className="absolute text-sm font-bold tracking-tighter text-foreground">
          {value}
        </span>
      )}
    </div>
  );
}

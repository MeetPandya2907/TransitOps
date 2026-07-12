import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted/50",
        "after:absolute after:inset-0 after:translate-x-[-100%] after:animate-shimmer",
        "after:bg-gradient-to-r after:from-transparent after:via-white/5 after:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }

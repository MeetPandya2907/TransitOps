import { useUIStore, type Toast } from "@/lib/store";
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = {
  default: null,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: AlertCircle,
  info: Info,
};

const colorMap = {
  default: 'border-border',
  success: 'border-emerald-500/30 bg-emerald-500/5',
  warning: 'border-amber-500/30 bg-amber-500/5',
  destructive: 'border-red-500/30 bg-red-500/5',
  info: 'border-blue-500/30 bg-blue-500/5',
};

const iconColorMap = {
  default: 'text-foreground',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  destructive: 'text-red-500',
  info: 'text-blue-500',
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useUIStore((s) => s.removeToast);
  const Icon = iconMap[toast.variant];

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 w-[380px] p-4 rounded-xl border bg-card shadow-elevated animate-toast-enter",
        colorMap[toast.variant]
      )}
    >
      {Icon && (
        <div className="shrink-0 mt-0.5">
          <Icon className={cn("h-5 w-5", iconColorMap[toast.variant])} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 p-1 rounded-md hover:bg-muted transition-colors"
      >
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

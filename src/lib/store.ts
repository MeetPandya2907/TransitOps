import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  commandPaletteOpen: boolean;
  toasts: Toast[];
  toggleSidebar: () => void;
  setSidebarMobileOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: 'default' | 'success' | 'warning' | 'destructive' | 'info';
  duration?: number;
}

let toastCounter = 0;

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  commandPaletteOpen: false,
  toasts: [],
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  addToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, toast.duration || 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

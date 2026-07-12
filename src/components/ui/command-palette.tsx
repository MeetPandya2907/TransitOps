import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUIStore } from "@/lib/store";
import {
  LayoutDashboard, Map, Route, Users, Truck, Wrench,
  Droplets, Bell, MapPin, FileText, BarChart3, TrendingUp,
  PieChart, Settings, Shield, Link as LinkIcon, Search, X
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  section: string;
  keywords?: string;
}

const commands: CommandItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', section: 'Navigation', keywords: 'home overview executive' },
  { id: 'tracking', label: 'Live Tracking', icon: Map, path: '/tracking', section: 'Navigation', keywords: 'map gps location' },
  { id: 'trips', label: 'Trips', icon: Route, path: '/trips', section: 'Navigation', keywords: 'dispatch routes delivery' },
  { id: 'drivers', label: 'Drivers', icon: Users, path: '/drivers', section: 'Navigation', keywords: 'personnel staff employees' },
  { id: 'vehicles', label: 'Vehicles', icon: Truck, path: '/vehicles', section: 'Navigation', keywords: 'fleet trucks cars' },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, path: '/maintenance', section: 'Navigation', keywords: 'repair service work order' },
  { id: 'fuel', label: 'Fuel & Expenses', icon: Droplets, path: '/fuel', section: 'Navigation', keywords: 'cost gasoline diesel' },
  { id: 'alerts', label: 'Alerts & Events', icon: Bell, path: '/alerts', section: 'Navigation', keywords: 'notifications warnings' },
  { id: 'geofences', label: 'Geofences', icon: MapPin, path: '/geofences', section: 'Navigation', keywords: 'zones boundaries areas' },
  { id: 'documents', label: 'Documents', icon: FileText, path: '/documents', section: 'Navigation', keywords: 'files insurance registration' },
  { id: 'reports', label: 'Reports', icon: BarChart3, path: '/reports', section: 'Analytics', keywords: 'analytics charts data' },
  { id: 'performance', label: 'Performance', icon: TrendingUp, path: '/performance', section: 'Analytics', keywords: 'metrics kpi' },
  { id: 'fuel-analytics', label: 'Fuel Analytics', icon: PieChart, path: '/fuel-analytics', section: 'Analytics', keywords: 'consumption efficiency' },
  { id: 'users', label: 'Users & Roles', icon: Shield, path: '/users', section: 'System', keywords: 'permissions access rbac' },
  { id: 'integrations', label: 'Integrations', icon: LinkIcon, path: '/integrations', section: 'System', keywords: 'api connect third-party' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings', section: 'System', keywords: 'configuration preferences' },
];

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.section.toLowerCase().includes(query.toLowerCase()) ||
      (cmd.keywords && cmd.keywords.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelect = useCallback((item: CommandItem) => {
    navigate(item.path);
    setCommandPaletteOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }, [navigate, setCommandPaletteOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === "Escape" && commandPaletteOpen) {
        setCommandPaletteOpen(false);
        setQuery("");
        setSelectedIndex(0);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
      handleSelect(filteredCommands[selectedIndex]);
    }
  };

  if (!commandPaletteOpen) return null;

  const sections = Array.from(new Set(filteredCommands.map((c) => c.section)));

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          setCommandPaletteOpen(false);
          setQuery("");
        }}
      />

      {/* Command Palette */}
      <div className="relative top-[20%] mx-auto w-full max-w-[560px] animate-scale-in">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-navy-700 shadow-2xl">
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b border-white/5 px-4">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, actions, settings..."
              className="flex-1 bg-transparent py-4 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              onClick={() => {
                setCommandPaletteOpen(false);
                setQuery("");
              }}
              className="shrink-0 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground bg-muted/50 hover:bg-muted"
            >
              ESC
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
            {filteredCommands.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No results found for "{query}"
              </div>
            ) : (
              sections.map((section) => (
                <div key={section} className="mb-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {section}
                  </div>
                  {filteredCommands
                    .filter((c) => c.section === section)
                    .map((item) => {
                      const globalIndex = filteredCommands.indexOf(item);
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                            selectedIndex === globalIndex
                              ? "bg-primary/15 text-primary"
                              : "text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="font-medium">{item.label}</span>
                          {selectedIndex === globalIndex && (
                            <span className="ml-auto text-[10px] text-muted-foreground">↵ to open</span>
                          )}
                        </button>
                      );
                    })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/5 px-4 py-2.5 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><kbd className="rounded bg-muted/50 px-1.5 py-0.5 font-mono">↑↓</kbd> Navigate</span>
              <span className="flex items-center gap-1"><kbd className="rounded bg-muted/50 px-1.5 py-0.5 font-mono">↵</kbd> Open</span>
              <span className="flex items-center gap-1"><kbd className="rounded bg-muted/50 px-1.5 py-0.5 font-mono">Esc</kbd> Close</span>
            </div>
            <span>TransitOps Command</span>
          </div>
        </div>
      </div>
    </div>
  );
}

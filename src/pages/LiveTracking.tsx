import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, MapPin, Zap } from "lucide-react";

export default function LiveTrackingPage() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="shrink-0">
        <PageHeader 
          title="Live Tracking" 
          description="Real-time map view of your entire fleet."
        />
      </div>
      <div className="flex-1 p-6 sm:p-8 pt-0 min-h-0 flex gap-6">
        <Card className="flex-1 border-white/[0.06] bg-card/50 glass overflow-hidden relative">
          {/* Mock Map View */}
          <div className="absolute inset-0 bg-[#0f172a] opacity-80">
            <div className="w-full h-full opacity-20" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            {/* SVG Routes */}
            <svg className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' }}>
              <path d="M 150 200 C 300 150, 400 350, 600 200" fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeDasharray="8 8" />
            </svg>
            
            <div className="absolute top-[200px] left-[600px] flex flex-col items-center -translate-x-1/2 -translate-y-full">
               <div className="bg-card border border-border shadow-xl rounded-md p-2 w-48 text-xs mb-2 relative z-20">
                 <div className="flex items-center justify-between mb-1">
                   <span className="font-bold">GJ05 AB 1234</span>
                   <span className="bg-emerald-500/20 text-emerald-500 px-1.5 rounded text-[10px] font-bold">Running</span>
                 </div>
                 <div className="flex justify-between text-[10px] text-muted-foreground">
                   <span className="flex items-center gap-1"><Zap size={10} className="text-amber-500" /> 65 km/h</span>
                   <span>Surat, GJ</span>
                 </div>
               </div>
               <div className="h-8 w-8 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900 shadow-lg flex items-center justify-center text-white relative z-10 animate-pulse">
                 <Truck size={16} />
               </div>
             </div>
          </div>
        </Card>
        
        <div className="w-80 flex flex-col gap-4 overflow-y-auto shrink-0 pr-2">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Active Vehicles</h3>
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border-white/[0.06] bg-card/30 hover:bg-card/60 transition-colors cursor-pointer">
              <CardContent className="p-4 flex gap-3">
                <div className="h-10 w-10 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0">
                  <Truck className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">GJ0{i} AB {1000 + i}</h4>
                  <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                    <MapPin className="h-3 w-3" />
                    Route {i} - In Transit
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

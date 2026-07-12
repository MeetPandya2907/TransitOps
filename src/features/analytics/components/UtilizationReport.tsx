import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { utilizationData } from "@/lib/analyticsData";

export function UtilizationReport() {
  return (
    <div className="grid grid-cols-1 gap-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Asset Utilization (Weekly)</CardTitle>
          <CardDescription>Tracks the number of active vs idle vehicles across the fleet.</CardDescription>
        </CardHeader>
        <CardContent className="h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={utilizationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorIdle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMaint" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.2} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Area type="monotone" dataKey="active" name="Active" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" />
              <Area type="monotone" dataKey="idle" name="Idle" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorIdle)" />
              <Area type="monotone" dataKey="maintenance" name="In Maintenance" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorMaint)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { name: "Jan", total: 120000 },
  { name: "Feb", total: 145000 },
  { name: "Mar", total: 132000 },
  { name: "Apr", total: 180000 },
  { name: "May", total: 195000 },
  { name: "Jun", total: 210000 },
  { name: "Jul", total: 250000 },
];

export default function RevenueChart() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-1">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">Revenue Trend</h3>
        <p className="text-sm text-muted-foreground">Monthly revenue performance</p>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => `₹${value / 1000}k`}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.1)',
                padding: '8px 12px'
              }}
              itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, fontSize: '14px' }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '12px', marginBottom: '4px' }}
              formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
            />
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorTotal)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--primary))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

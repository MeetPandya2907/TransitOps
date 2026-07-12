import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

const data = [
  { name: "Active", value: 450, color: "hsl(var(--primary))" },
  { name: "Maintenance", value: 85, color: "hsl(var(--destructive))" },
  { name: "Idle", value: 120, color: "hsl(var(--muted-foreground))" },
];

export default function VehicleStatusChart() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-1">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">Vehicle Status</h3>
        <p className="text-sm text-muted-foreground">Current distribution of fleet</p>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.1)',
                padding: '8px 12px'
              }}
              itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, fontSize: '14px' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              formatter={(value) => <span className="text-sm text-foreground font-medium ml-1">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

import { Sparkles, ArrowRight } from "lucide-react";

const recommendations = [
  {
    id: 1,
    title: "Optimize Route #402",
    description: "Historical data suggests rerouting via I-90 will save 12% in fuel costs due to current traffic patterns.",
    action: "View Route",
  },
  {
    id: 2,
    title: "Preventive Maintenance",
    description: "3 vehicles (V-082, V-114, V-205) are nearing their 50k mile service interval. Schedule now to prevent downtime.",
    action: "Schedule Service",
  },
];

export default function AiRecommendations() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
        <h3 className="text-lg font-semibold tracking-tight text-foreground">AI Insights</h3>
      </div>
      
      <div className="space-y-4 relative z-10">
        {recommendations.map((rec) => (
          <div key={rec.id} className="group rounded-lg border bg-card/60 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-card hover:shadow-soft cursor-pointer">
            <h4 className="font-medium text-foreground">{rec.title}</h4>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{rec.description}</p>
            <button className="mt-3 flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors group-hover:underline underline-offset-4">
              {rec.action}
              <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        ))}
      </div>
      
      {/* Decorative gradient blob */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
    </div>
  );
}

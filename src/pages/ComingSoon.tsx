import { PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function ComingSoon() {
  const navigate = useNavigate();
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-6">
      <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <PackageOpen className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Module Under Construction</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        This feature is currently being built and will be available in the next release of TransitOps.
      </p>
      <Button onClick={() => navigate('/dashboard')} variant="default" size="lg">
        Return to Dashboard
      </Button>
    </div>
  );
}

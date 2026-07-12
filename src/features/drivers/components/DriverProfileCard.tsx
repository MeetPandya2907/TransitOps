import { Mail, Phone, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gauge } from "@/components/ui/gauge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useSupabaseDelete } from "@/lib/useSupabaseMutation";
import type { Driver } from "@/lib/driverData";
import { cn } from "@/lib/utils";

interface DriverProfileCardProps {
  driver: Driver;
}

export function DriverProfileCard({ driver }: DriverProfileCardProps) {
  const deleteMutation = useSupabaseDelete<Driver>('drivers');

  const getStatusColor = (status: Driver["status"]) => {
    switch (status) {
      case 'Available': return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400";
      case 'On Duty': return "bg-primary/10 text-primary border-primary/20";
      case 'Sick Leave': return "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const today = new Date();
  const isLicenseExpiring = new Date(driver.licenseExpiry).getTime() - today.getTime() < 30 * 86400000;
  const isMedicalExpiring = new Date(driver.medicalExpiry).getTime() - today.getTime() < 30 * 86400000;
  const isLicenseExpired = new Date(driver.licenseExpiry) < today;
  
  const hasAlerts = isLicenseExpiring || isMedicalExpiring || driver.violationCount > 0;

  return (
    <Card className={cn(
      "group overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1",
      isLicenseExpired && "border-destructive/50 ring-1 ring-destructive/20"
    )}>
      <CardContent className="p-0">
        <div className="flex flex-col">
          {/* Top section */}
          <div className="flex items-start justify-between p-5 pb-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                <AvatarImage src={driver.avatarUrl} alt={driver.name} />
                <AvatarFallback className="font-bold text-muted-foreground">
                  {driver.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col mt-0.5">
                <h3 className="text-base font-bold tracking-tight text-foreground leading-tight">{driver.name}</h3>
                <div className="text-xs text-muted-foreground mt-0.5">{driver.id} • {driver.yearsOfExperience}y exp</div>
                <div className="mt-2">
                   <Badge variant="outline" className={getStatusColor(driver.status)}>
                     {driver.status}
                   </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <Gauge value={driver.safetyScore} size={48} strokeWidth={4} />
              <span className="text-[9px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">Safety</span>
            </div>
          </div>

          {/* Alerts Section */}
          {hasAlerts && (
            <div className="px-5 py-2.5 bg-muted/40 border-y space-y-1.5">
              {isLicenseExpiring && (
                <div className={cn("flex items-center gap-2 text-xs font-medium", isLicenseExpired ? "text-destructive" : "text-amber-600 dark:text-amber-500")}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  License {isLicenseExpired ? "expired" : "expires"} {new Date(driver.licenseExpiry).toLocaleDateString()}
                </div>
              )}
              {isMedicalExpiring && !isLicenseExpired && (
                <div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-500">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Medical expires {new Date(driver.medicalExpiry).toLocaleDateString()}
                </div>
              )}
              {driver.violationCount > 0 && (
                <div className="flex items-center gap-2 text-xs font-medium text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {driver.violationCount} active violation{driver.violationCount > 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}

          {/* Stats & Actions */}
          <div className="flex items-center justify-between p-5 bg-background">
            <div className="flex gap-5">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">Trips</span>
                <span className="text-sm font-semibold">{driver.totalTrips}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Contact</span>
                <div className="flex gap-2">
                  <button className="text-muted-foreground hover:text-primary transition-colors"><Phone className="h-3.5 w-3.5" /></button>
                  <button className="text-muted-foreground hover:text-primary transition-colors"><Mail className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="shadow-sm h-8 text-xs font-semibold">
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Profile</DropdownMenuItem>
                <DropdownMenuItem>Assign Vehicle</DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this driver?')) {
                      deleteMutation.mutate(driver.id);
                    }
                  }}
                >
                  Delete Driver
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

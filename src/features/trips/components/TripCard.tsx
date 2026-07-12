import { MoreHorizontal, MapPin, Clock, User, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Trip, TripStatus } from "@/lib/tripData";
import { cn } from "@/lib/utils";

interface TripCardProps {
  trip: Trip;
  onStatusChange: (id: string, status: TripStatus) => void;
  onDelete?: (id: string) => void;
}

export function TripCard({ trip, onStatusChange, onDelete }: TripCardProps) {
  const getPriorityColor = () => {
    switch(trip.priority) {
      case 'Urgent': return 'bg-destructive/10 text-destructive border-destructive/20 dark:text-red-400';
      case 'High': return 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400';
      case 'Standard': return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-default bg-card group border-muted">
      <CardContent className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{trip.id}</span>
            <Badge variant="outline" className={cn("mt-1.5 text-[10px] px-2 py-0 h-5", getPriorityColor())}>
              {trip.priority}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-6 w-6 p-0 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="sr-only">Actions</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Move to</div>
              {trip.status !== 'Draft' && <DropdownMenuItem onClick={() => onStatusChange(trip.id, 'Draft')}>Draft</DropdownMenuItem>}
              {trip.status !== 'Dispatched' && <DropdownMenuItem onClick={() => onStatusChange(trip.id, 'Dispatched')}>Dispatched</DropdownMenuItem>}
              {trip.status !== 'In Transit' && <DropdownMenuItem onClick={() => onStatusChange(trip.id, 'In Transit')}>In Transit</DropdownMenuItem>}
              {trip.status !== 'Completed' && <DropdownMenuItem onClick={() => onStatusChange(trip.id, 'Completed')}>Completed</DropdownMenuItem>}
              
              {onDelete && (
                <>
                  <div className="my-1 h-px bg-border" />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this trip?')) {
                        onDelete(trip.id);
                      }
                    }}
                  >
                    Delete Trip
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Route */}
        <div className="flex flex-col gap-2 relative mt-1">
          <div className="absolute left-[7px] top-3 bottom-3 w-0.5 bg-border rounded-full"></div>
          <div className="flex items-center gap-3 text-sm z-10">
            <div className="h-4 w-4 rounded-full bg-background border-2 border-primary flex items-center justify-center shrink-0">
               <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>
            <span className="font-semibold truncate text-foreground">{trip.origin}</span>
          </div>
          <div className="flex items-center gap-3 text-sm z-10">
            <div className="h-4 w-4 rounded-full bg-background flex items-center justify-center shrink-0">
              <MapPin className="h-[18px] w-[18px] text-destructive" />
            </div>
            <span className="font-semibold truncate text-foreground">{trip.destination}</span>
          </div>
        </div>

        {/* Footer info */}
        {(trip.driverName || trip.eta) && (
          <div className="pt-3 mt-1 border-t flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {trip.driverName && (
                <div className="flex items-center gap-1.5" title={trip.driverName}>
                  <User className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground truncate max-w-[80px]">{trip.driverName.split(' ')[0]}</span>
                </div>
              )}
              {trip.vehicleId && (
                <div className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" />
                  <span className="font-mono text-[10px] bg-muted px-1 rounded font-semibold text-foreground">{trip.vehicleId}</span>
                </div>
              )}
            </div>
            {trip.eta && trip.status !== 'Completed' && (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 font-semibold shrink-0">
                <Clock className="h-3.5 w-3.5" />
                {new Date(trip.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export type VehicleStatus = 'Active' | 'Maintenance' | 'Out of Service' | 'Idle';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  status: VehicleStatus;
  assignedDriver?: string;
  mileage: number;
  fuelEfficiency: number; // MPG
  lastMaintenance: string; // ISO date string
}

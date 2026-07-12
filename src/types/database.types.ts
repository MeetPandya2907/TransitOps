export type UserRole = 'Fleet Manager' | 'Driver' | 'Safety Officer' | 'Financial Analyst';

export type VehicleStatus = 'Available' | 'On Trip' | 'In Shop' | 'Retired';

export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';

export type TripStatus = 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Vehicle {
  id: string;
  registration_number: string;
  name: string;
  type: string;
  max_load_capacity: number;
  odometer: number;
  acquisition_cost: number;
  status: VehicleStatus;
  created_at: string;
}

export interface Driver {
  id: string;
  name: string;
  license_number: string;
  license_category: string;
  license_expiry_date: string;
  contact_number: string;
  safety_score: number;
  status: DriverStatus;
  created_at: string;
}

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicle_id: string;
  driver_id: string;
  cargo_weight: number;
  planned_distance: number;
  status: TripStatus;
  actual_odometer_start?: number;
  actual_odometer_end?: number;
  fuel_consumed?: number;
  revenue: number;
  created_at: string;
  // Relations
  vehicles?: Vehicle;
  drivers?: Driver;
}

export interface MaintenanceLog {
  id: string;
  vehicle_id: string;
  description: string;
  cost: number;
  start_date: string;
  end_date?: string;
  status: 'Active' | 'Closed';
  created_at: string;
  vehicles?: Vehicle;
}

export interface FuelLog {
  id: string;
  vehicle_id: string;
  trip_id?: string;
  liters: number;
  cost: number;
  date: string;
  created_at: string;
  vehicles?: Vehicle;
}

export interface Expense {
  id: string;
  vehicle_id: string;
  trip_id?: string;
  type: string;
  cost: number;
  date: string;
  description?: string;
  created_at: string;
  vehicles?: Vehicle;
}

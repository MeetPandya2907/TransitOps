export type TripStatus = 'Draft' | 'Dispatched' | 'In Transit' | 'Completed';
export type TripPriority = 'Standard' | 'High' | 'Urgent';

export interface Trip {
  id: string;
  origin: string;
  destination: string;
  status: TripStatus;
  priority: TripPriority;
  driverId?: string;
  driverName?: string;
  vehicleId?: string;
  eta?: string; // ISO Date
  distance: number;
}

const generateId = () => `TRP-${Math.floor(10000 + Math.random() * 90000)}`;

const cities = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA', 'Austin, TX', 'Jacksonville, FL', 'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC'];

const priorities: TripPriority[] = ['Standard', 'Standard', 'Standard', 'High', 'Urgent'];
const statuses: TripStatus[] = ['Draft', 'Draft', 'Draft', 'Dispatched', 'Dispatched', 'In Transit', 'In Transit', 'In Transit', 'Completed', 'Completed'];

const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];

export const mockTrips: Trip[] = Array.from({ length: 42 }, (_, i) => {
  const origin = cities[Math.floor(Math.random() * cities.length)];
  let destination = cities[Math.floor(Math.random() * cities.length)];
  while (origin === destination) {
    destination = cities[Math.floor(Math.random() * cities.length)];
  }

  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const isAssigned = status !== 'Draft';
  
  return {
    id: generateId(),
    origin,
    destination,
    status,
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    driverId: isAssigned ? `DRV-${1000 + i}` : undefined,
    driverName: isAssigned ? `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}` : undefined,
    vehicleId: isAssigned ? `V-${1000 + i}` : undefined,
    eta: status === 'In Transit' || status === 'Dispatched' ? new Date(Date.now() + Math.random() * 172800000).toISOString() : undefined,
    distance: Math.floor(50 + Math.random() * 2000),
  };
});

export type MaintenanceStatus = 'Upcoming' | 'In Progress' | 'Completed' | 'Overdue';
export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type ServiceType = 'Preventive' | 'Repair' | 'Inspection' | 'Tire Replacement' | 'Oil Change';

export interface WorkOrder {
  id: string;
  vehicleId: string;
  serviceType: ServiceType;
  description: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  scheduledDate: string; // ISO
  completedDate?: string; // ISO
  mechanic?: string;
  cost?: number;
}

const generateId = () => `WO-${Math.floor(100000 + Math.random() * 900000)}`;

const serviceTypes: ServiceType[] = ['Preventive', 'Repair', 'Inspection', 'Tire Replacement', 'Oil Change'];
const statuses: MaintenanceStatus[] = ['Upcoming', 'Upcoming', 'In Progress', 'Completed', 'Completed', 'Overdue'];
const priorities: MaintenancePriority[] = ['Low', 'Medium', 'Medium', 'High', 'Critical'];
const mechanics = ['Mike Taylor', 'Sarah Conner', 'Dave Batista', 'John Cena'];

export const mockWorkOrders: WorkOrder[] = Array.from({ length: 45 }, (_, i) => {
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const isCompleted = status === 'Completed';
  const scheduledOffset = (Math.random() * 60) - 30; // -30 to +30 days
  const scheduledDate = new Date(Date.now() + scheduledOffset * 86400000).toISOString().split('T')[0];

  return {
    id: generateId(),
    vehicleId: `V-${1000 + Math.floor(Math.random() * 50)}`,
    serviceType: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
    description: `Standard ${serviceTypes[Math.floor(Math.random() * serviceTypes.length)].toLowerCase()} service and checkup.`,
    status: status,
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    scheduledDate: scheduledDate,
    completedDate: isCompleted ? new Date(Date.now() - Math.random() * 86400000 * 10).toISOString().split('T')[0] : undefined,
    mechanic: status !== 'Upcoming' ? mechanics[Math.floor(Math.random() * mechanics.length)] : undefined,
    cost: isCompleted ? Math.floor(150 + Math.random() * 2000) : undefined,
  };
});

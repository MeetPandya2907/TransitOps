export type DriverStatus = 'Available' | 'On Duty' | 'Off Duty' | 'Sick Leave';

export interface Driver {
  id: string;
  name: string;
  avatarUrl: string;
  status: DriverStatus;
  safetyScore: number; // 0-100
  licenseExpiry: string; // ISO Date
  medicalExpiry: string; // ISO Date
  violationCount: number;
  totalTrips: number;
  yearsOfExperience: number;
  contactNumber: string;
}

const generateId = () => `DRV-${Math.floor(1000 + Math.random() * 9000)}`;

const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas'];

const statuses: DriverStatus[] = ['Available', 'On Duty', 'On Duty', 'On Duty', 'Off Duty', 'Off Duty', 'Sick Leave'];

export const mockDrivers: Driver[] = Array.from({ length: 24 }, (_, i) => {
  const safetyScore = Math.floor(65 + Math.random() * 35); // 65-100
  const daysToLicenseExpiry = Math.floor(-10 + Math.random() * 400);
  const daysToMedicalExpiry = Math.floor(-10 + Math.random() * 400);

  const licenseExpiry = new Date(Date.now() + daysToLicenseExpiry * 86400000).toISOString().split('T')[0];
  const medicalExpiry = new Date(Date.now() + daysToMedicalExpiry * 86400000).toISOString().split('T')[0];

  return {
    id: generateId(),
    name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
    avatarUrl: `https://i.pravatar.cc/150?u=drv${i}`, // Using pravatar for reliable avatars
    status: statuses[Math.floor(Math.random() * statuses.length)],
    safetyScore,
    licenseExpiry,
    medicalExpiry,
    violationCount: safetyScore > 90 ? 0 : Math.floor(Math.random() * 4),
    totalTrips: Math.floor(50 + Math.random() * 500),
    yearsOfExperience: Math.floor(1 + Math.random() * 20),
    contactNumber: `(555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
  };
});

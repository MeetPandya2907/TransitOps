import type { Vehicle } from './types';

const makesAndModels = [
  { make: 'Freightliner', models: ['Cascadia', 'M2 106'] },
  { make: 'Volvo', models: ['VNL 860', 'VNR 640'] },
  { make: 'Peterbilt', models: ['579', '389'] },
  { make: 'Kenworth', models: ['T680', 'W990'] },
  { make: 'Ford', models: ['Transit 350', 'F-150 Lightning'] },
];

const statuses: Vehicle['status'][] = ['Active', 'Active', 'Active', 'Idle', 'Maintenance', 'Out of Service'];

const generateId = () => `V-${Math.floor(1000 + Math.random() * 9000)}`;
const generatePlate = () => `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(1000 + Math.random() * 9000)}`;
const generateDriver = () => {
  const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas'];
  return Math.random() > 0.15 ? `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}` : undefined;
};

// Ensure deterministic-like mock data generation for consistent UI testing, 
// though we use Math.random, it's fine for simple mocks.
export const mockVehicles: Vehicle[] = Array.from({ length: 58 }, (_, i) => {
  const makeObj = makesAndModels[Math.floor(Math.random() * makesAndModels.length)];
  const model = makeObj.models[Math.floor(Math.random() * makeObj.models.length)];
  
  return {
    id: `V-${1000 + i}`,
    make: makeObj.make,
    model,
    year: 2018 + Math.floor(Math.random() * 7),
    licensePlate: generatePlate(),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    assignedDriver: generateDriver(),
    mileage: Math.floor(10000 + Math.random() * 300000),
    fuelEfficiency: +(5 + Math.random() * 15).toFixed(1),
    lastMaintenance: new Date(Date.now() - Math.random() * 15000000000).toISOString().split('T')[0],
  };
});

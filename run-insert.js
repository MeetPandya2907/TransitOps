import pkg from 'pg';

const { Client } = pkg;

async function runInsert() {
  const connectionString = 'postgresql://postgres:PostgerdOdoo@db.lzzfrirzreufleewgmfp.supabase.co:5432/postgres';
  
  const client = new Client({
    connectionString,
  });

  try {
    console.log('Connecting to Supabase to insert dummy data...');
    await client.connect();
    console.log('Connected!');

    const insertSQL = `
      -- Insert Region
      INSERT INTO regions (name, description) VALUES ('North India', 'Operations in Northern region') ON CONFLICT (name) DO NOTHING;
      
      -- Insert Vehicle Types
      INSERT INTO vehicle_types (name, description) VALUES ('Sedan', 'Standard 4 door') ON CONFLICT (name) DO NOTHING;
      INSERT INTO vehicle_types (name, description) VALUES ('Truck', 'Heavy duty') ON CONFLICT (name) DO NOTHING;
      
      -- Get IDs
      DO $$
      DECLARE
        region_id UUID;
        sedan_id UUID;
        truck_id UUID;
        vehicle1 UUID;
        vehicle2 UUID;
      BEGIN
        SELECT id INTO region_id FROM regions WHERE name = 'North India' LIMIT 1;
        SELECT id INTO sedan_id FROM vehicle_types WHERE name = 'Sedan' LIMIT 1;
        SELECT id INTO truck_id FROM vehicle_types WHERE name = 'Truck' LIMIT 1;
        
        -- Insert Vehicles
        INSERT INTO vehicles (type_id, region_id, make, model, year, license_plate, vin, status, current_mileage) 
        VALUES (sedan_id, region_id, 'Toyota', 'Camry', 2023, 'DL-01-AB-1234', 'VIN1234567890', 'Active', 15000)
        ON CONFLICT (license_plate) DO NOTHING;
        
        INSERT INTO vehicles (type_id, region_id, make, model, year, license_plate, vin, status, current_mileage) 
        VALUES (truck_id, region_id, 'Tata', 'Prima', 2022, 'MH-12-CD-5678', 'VIN0987654321', 'Maintenance', 45000)
        ON CONFLICT (license_plate) DO NOTHING;
        
        SELECT id INTO vehicle1 FROM vehicles WHERE license_plate = 'DL-01-AB-1234' LIMIT 1;
        SELECT id INTO vehicle2 FROM vehicles WHERE license_plate = 'MH-12-CD-5678' LIMIT 1;
        
        -- Insert Maintenance Logs
        INSERT INTO maintenance_logs (vehicle_id, service_type, description, status, scheduled_date, cost)
        VALUES (vehicle1, 'Routine Service', 'Oil change and basic check', 'Completed', '2026-07-10', 4500.00);
        
        INSERT INTO maintenance_logs (vehicle_id, service_type, description, status, scheduled_date, cost)
        VALUES (vehicle2, 'Engine Repair', 'Fixing timing belt', 'In Progress', '2026-07-12', 125000.00);
        
        INSERT INTO maintenance_logs (vehicle_id, service_type, description, status, scheduled_date, cost)
        VALUES (vehicle1, 'Brake Inspection', 'Checking brake pads', 'Pending', '2026-07-15', 2000.00);
        
        -- Insert Fuel Logs
        INSERT INTO fuel_logs (vehicle_id, gallons, cost, fuel_date, location)
        VALUES (vehicle1, 15.4, 1500.50, '2026-07-10 10:00:00', 'Delhi Petrol Pump');
        
        INSERT INTO fuel_logs (vehicle_id, gallons, cost, fuel_date, location)
        VALUES (vehicle2, 50.0, 4800.00, '2026-07-11 14:30:00', 'Mumbai Highway Pump');
        
        INSERT INTO fuel_logs (vehicle_id, gallons, cost, fuel_date, location)
        VALUES (vehicle1, 12.0, 1180.00, '2026-07-12 09:15:00', 'Gurgaon City Pump');
        
      END $$;
    `;

    await client.query(insertSQL);
    console.log('Dummy data inserted successfully!');
  } catch (error) {
    console.error('Error inserting data:', error);
  } finally {
    await client.end();
  }
}

runInsert();

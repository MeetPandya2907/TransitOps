import pkg from 'pg';
const { Client } = pkg;

async function fix() {
  const connectionString = 'postgresql://postgres:PostgerdOdoo@db.lzzfrirzreufleewgmfp.supabase.co:5432/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to DB!');
    
    // Fix Maintenance RLS
    await client.query(`
        DROP POLICY IF EXISTS "Allow authenticated users to insert maintenance" ON maintenance_logs;
        DROP POLICY IF EXISTS "Allow authenticated users to read maintenance" ON maintenance_logs;
        DROP POLICY IF EXISTS "Allow authenticated users to update maintenance" ON maintenance_logs;
        
        DROP POLICY IF EXISTS "Allow public read maintenance" ON maintenance_logs;
        DROP POLICY IF EXISTS "Allow public insert maintenance" ON maintenance_logs;
        DROP POLICY IF EXISTS "Allow public update maintenance" ON maintenance_logs;
        
        CREATE POLICY "Allow public read maintenance" ON maintenance_logs FOR SELECT TO public USING (true);
        CREATE POLICY "Allow public insert maintenance" ON maintenance_logs FOR INSERT TO public WITH CHECK (true);
        CREATE POLICY "Allow public update maintenance" ON maintenance_logs FOR UPDATE TO public USING (true);
    `);
    console.log('Fixed maintenance RLS!');
    
    // Fix Vehicles RLS
    await client.query(`
        DROP POLICY IF EXISTS "Allow authenticated users to read vehicles" ON vehicles;
        DROP POLICY IF EXISTS "Allow public read vehicles" ON vehicles;
        CREATE POLICY "Allow public read vehicles" ON vehicles FOR SELECT TO public USING (true);
    `);
    console.log('Fixed vehicles RLS!');

    // Insert Vehicles if they don't exist
    await client.query(`
        INSERT INTO vehicles (make, model, year, license_plate, vin, status, current_mileage) 
        VALUES 
        ('Tata', 'Prima', 2021, 'GJ05 AB 1234', 'VIN1234567890', 'Active', 45000),
        ('Ashok Leyland', 'Boss', 2022, 'GJ12 XY 5678', 'VIN0987654321', 'Maintenance', 32000),
        ('Mahindra', 'Blazo', 2020, 'GJ01 KL 9001', 'VIN1122334455', 'Active', 85000),
        ('Volvo', 'FM', 2023, 'GJ05 MN 3456', 'VIN5566778899', 'Out of Service', 12000)
        ON CONFLICT (license_plate) DO NOTHING;
    `);
    console.log('Inserted real vehicles!');

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
fix();

import pkg from 'pg';
const { Client } = pkg;

async function fix() {
  const connectionString = 'postgresql://postgres:PostgerdOdoo@db.lzzfrirzreufleewgmfp.supabase.co:5432/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to DB!');
    
    // Fix Vehicles RLS
    await client.query(`
        DROP POLICY IF EXISTS "Allow public insert vehicles" ON vehicles;
        DROP POLICY IF EXISTS "Allow public update vehicles" ON vehicles;
        CREATE POLICY "Allow public insert vehicles" ON vehicles FOR INSERT TO public WITH CHECK (true);
        CREATE POLICY "Allow public update vehicles" ON vehicles FOR UPDATE TO public USING (true);
    `);
    console.log('Fixed vehicles INSERT RLS!');

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
fix();

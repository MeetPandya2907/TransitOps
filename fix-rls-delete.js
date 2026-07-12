import pkg from 'pg';
const { Client } = pkg;

async function fix() {
  const connectionString = 'postgresql://postgres:PostgerdOdoo@db.lzzfrirzreufleewgmfp.supabase.co:5432/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to DB!');
    
    // Fix Maintenance DELETE RLS
    await client.query(`
        DROP POLICY IF EXISTS "Allow public delete maintenance" ON maintenance_logs;
        CREATE POLICY "Allow public delete maintenance" ON maintenance_logs FOR DELETE TO public USING (true);
    `);
    console.log('Fixed maintenance DELETE RLS!');

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
fix();

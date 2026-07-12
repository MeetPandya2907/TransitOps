import pkg from 'pg';
const { Client } = pkg;

async function fix() {
  const connectionString = 'postgresql://postgres:PostgerdOdoo@db.lzzfrirzreufleewgmfp.supabase.co:5432/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    await client.query(`
        DROP POLICY IF EXISTS "Allow public read fuel_logs" ON fuel_logs;
        DROP POLICY IF EXISTS "Allow public insert fuel_logs" ON fuel_logs;
        DROP POLICY IF EXISTS "Allow public update fuel_logs" ON fuel_logs;
        DROP POLICY IF EXISTS "Allow public delete fuel_logs" ON fuel_logs;
        
        CREATE POLICY "Allow public read fuel_logs" ON fuel_logs FOR SELECT TO public USING (true);
        CREATE POLICY "Allow public insert fuel_logs" ON fuel_logs FOR INSERT TO public WITH CHECK (true);
        CREATE POLICY "Allow public update fuel_logs" ON fuel_logs FOR UPDATE TO public USING (true);
        CREATE POLICY "Allow public delete fuel_logs" ON fuel_logs FOR DELETE TO public USING (true);
    `);
    console.log('Fixed fuel_logs RLS!');

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
fix();

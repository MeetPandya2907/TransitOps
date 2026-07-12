import pkg from 'pg';
const { Client } = pkg;

async function fix() {
  const connectionString = 'postgresql://postgres:PostgerdOdoo@db.lzzfrirzreufleewgmfp.supabase.co:5432/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    await client.query(`
        DROP POLICY IF EXISTS "Allow public read expenses" ON expenses;
        DROP POLICY IF EXISTS "Allow public insert expenses" ON expenses;
        DROP POLICY IF EXISTS "Allow public update expenses" ON expenses;
        DROP POLICY IF EXISTS "Allow public delete expenses" ON expenses;
        
        CREATE POLICY "Allow public read expenses" ON expenses FOR SELECT TO public USING (true);
        CREATE POLICY "Allow public insert expenses" ON expenses FOR INSERT TO public WITH CHECK (true);
        CREATE POLICY "Allow public update expenses" ON expenses FOR UPDATE TO public USING (true);
        CREATE POLICY "Allow public delete expenses" ON expenses FOR DELETE TO public USING (true);
    `);
    console.log('Fixed expenses RLS!');

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
fix();

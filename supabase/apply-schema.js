import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new pg.Client({
  host: 'db.yncmjhgcyzkygczhvukn.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'ranafenil@123',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function applySchema() {
  console.log('Connecting to Supabase...');
  try {
    await client.connect();
    console.log('Connected!');

    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log(`Reading schema file from: ${schemaPath}`);
    
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing schema SQL... (This creates all tables, triggers, and policies)');
    await client.query(schemaSql);
    
    console.log('✅ Schema created successfully! All tables are now in your database.');
    
    // Now let's re-run the RLS disable script just to be safe, since we recreated the tables
    console.log('Disabling RLS on newly created tables...');
    const disableRlsSql = `
      ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.drivers DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.maintenance_logs DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.fuel_logs DISABLE ROW LEVEL SECURITY;
    `;
    await client.query(disableRlsSql);
    console.log('✅ RLS disabled successfully.');

  } catch (err) {
    console.error('❌ Error applying schema:', err);
  } finally {
    await client.end();
  }
}

applySchema();

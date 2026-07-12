import pg from 'pg';

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

const sql = `
  ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.drivers DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.maintenance_logs DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.fuel_logs DISABLE ROW LEVEL SECURITY;
`;

async function disableRLS() {
  console.log('Connecting to database...');
  try {
    await client.connect();
    console.log('Disabling Row-Level Security on all tables...');
    await client.query(sql);
    console.log('RLS disabled successfully! The database is now accessible without authentication.');
  } catch (err) {
    console.error('Error disabling RLS:', err);
  } finally {
    await client.end();
  }
}

disableRLS();

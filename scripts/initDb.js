import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:OddoAniket%40123@db.zculaywoofoqssqvsaug.supabase.co:5432/postgres';

const schema = `
-- Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  location TEXT,
  last_service TEXT,
  fuel_level INTEGER
);

-- Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  license_class TEXT,
  safety_score INTEGER,
  hours_driven INTEGER,
  phone TEXT,
  avatar_url TEXT
);

-- Trips Table
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  status TEXT NOT NULL,
  vehicle_id TEXT,
  driver_name TEXT,
  eta TEXT,
  distance INTEGER,
  priority TEXT
);

-- Work Orders Table
CREATE TABLE IF NOT EXISTS work_orders (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  service_type TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT,
  scheduled_date TEXT,
  estimated_cost INTEGER,
  assigned_mechanic TEXT,
  notes TEXT
);

-- Fuel Logs Table
CREATE TABLE IF NOT EXISTS fuel_logs (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  liters NUMERIC NOT NULL,
  cost NUMERIC NOT NULL,
  date TEXT NOT NULL
);

-- Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  severity TEXT NOT NULL,
  date TEXT NOT NULL
);

-- Geofences Table
CREATE TABLE IF NOT EXISTS geofences (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  radius NUMERIC NOT NULL,
  location TEXT NOT NULL
);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  expiry_date TEXT
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL
);
`;

async function initDb() {
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('Connected to database.');
    await client.query(schema);
    console.log('Schema created successfully!');
  } catch (err) {
    console.error('Error creating schema:', err);
  } finally {
    await client.end();
  }
}

initDb();

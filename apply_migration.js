import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { Client } from 'pg';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing DATABASE_URL in .env");
  process.exit(1);
}

const client = new Client({
  connectionString: connectionString,
});

async function runMigration() {
  await client.connect();

  const sql = `
    ALTER TABLE drivers ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL;
    
    ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Read Trips" ON trips;
    DROP POLICY IF EXISTS "Manage Drivers" ON drivers;
    DROP POLICY IF EXISTS "Driver Read Own Data" ON drivers;
    DROP POLICY IF EXISTS "Driver Read Own Trips" ON trips;

    -- Drivers RLS
    CREATE POLICY "Manage Drivers" ON drivers FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_roles ur 
        JOIN roles r ON ur.role_id = r.id 
        WHERE ur.user_id = auth.uid() AND r.name IN ('FleetManager', 'Dispatcher')
      )
    );
    CREATE POLICY "Driver Read Own Data" ON drivers FOR SELECT USING (user_id = auth.uid());

    -- Trips RLS
    CREATE POLICY "Driver Read Own Trips" ON trips FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM drivers d WHERE d.id = trips.driver_id AND d.user_id = auth.uid()
      )
    );
  `;

  try {
    await client.query(sql);
    console.log("Migration applied successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.end();
  }
}

runMigration();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function fixTriggers() {
  const sql = `
    DROP TRIGGER IF EXISTS trg_validate_trip ON trips;
    DROP TRIGGER IF EXISTS trg_trip_status ON trips;
    
    DROP TRIGGER IF EXISTS trg_01_validate_trip ON trips;
    CREATE TRIGGER trg_01_validate_trip
    BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION validate_trip_rules();
    
    DROP TRIGGER IF EXISTS trg_02_trip_status ON trips;
    CREATE TRIGGER trg_02_trip_status
    BEFORE UPDATE ON trips
    FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION handle_trip_status_change();
  `;
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  if (error) {
     console.error('Error executing SQL via RPC, it might not exist.', error.message);
  } else {
     console.log('Successfully updated triggers');
  }
}
fixTriggers();

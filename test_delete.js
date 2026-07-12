import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@transitops.com',
    password: 'password123'
  });
  
  console.log("Auth:", auth.user ? "Success" : authErr?.message);

  const { data: drivers } = await supabase.from('drivers').select('*').like('license_number', 'PENDING-%');
  console.log("Drivers to delete:", drivers?.length);
  
  if (drivers && drivers.length > 0) {
    const { error } = await supabase.from('drivers').delete().eq('id', drivers[0].id);
    console.log("Delete result:", error ? error.message : "Success");
  }
}
main();

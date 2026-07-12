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

async function checkTables() {
  try {
    await client.connect();
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    
    console.log('Tables found in the "public" schema:');
    if (result.rows.length === 0) {
      console.log('NONE! (The schema is empty)');
    } else {
      result.rows.forEach(row => console.log(`- ${row.table_name}`));
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkTables();

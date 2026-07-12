import pkg from 'pg';
import fs from 'fs/promises';

const { Client } = pkg;

async function runSchema() {
  const connectionString = 'postgresql://postgres:PostgerdOdoo@db.lzzfrirzreufleewgmfp.supabase.co:5432/postgres';
  
  const client = new Client({
    connectionString,
  });

  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('Connected!');

    console.log('Reading schema.sql...');
    const schema = await fs.readFile('schema.sql', 'utf8');

    console.log('Executing schema...');
    await client.query(schema);

    console.log('Schema executed successfully! Your tables are now created.');
  } catch (error) {
    console.error('Error executing schema:', error);
  } finally {
    await client.end();
  }
}

runSchema();

import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

const connectionString = 'postgresql://postgres:OddoAniket%40123@db.zculaywoofoqssqvsaug.supabase.co:5432/postgres';

async function applySchema() {
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('Connected to Supabase database.');

    const schemaPath = path.join(process.cwd(), 'supabase-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Applying schema...');
    await client.query(schemaSql);
    console.log('Schema applied successfully!');

  } catch (error) {
    console.error('Error applying schema:', error);
  } finally {
    await client.end();
  }
}

applySchema();

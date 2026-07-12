import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlFilePath = path.join(__dirname, 'schema.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

// Config connection details for your Supabase project yncmjhgcyzkygczhvukn
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

async function runSchema() {
  console.log('Connecting to Supabase Database...');
  try {
    await client.connect();
    console.log('Connected successfully! Running SQL schema and seed data...');
    
    // Execute the entire SQL script
    await client.query(sql);
    
    console.log('Database tables, enums, triggers, RLS policies, and seed data initialized successfully!');
  } catch (err) {
    console.error('Error executing SQL script:', err);
  } finally {
    await client.end();
  }
}

runSchema();

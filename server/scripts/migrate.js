/**
 * Migration runner using pg to apply SQL to Supabase PostgreSQL.
 * Uses SUPABASE_DB_URL (Postgres connection string).
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error('❌ SUPABASE_DB_URL is not set.');
    console.error('   Set it in server/.env to your Supabase Postgres connection string.');
    console.error('   Find it in: Supabase Dashboard → Settings → Database → Connection string (Session pooler)');
    console.error('');
    console.error('   Alternatively, you can run the SQL manually:');
    console.error('   1. Go to Supabase Dashboard → SQL Editor');
    console.error('   2. Paste the contents of supabase/migrations/001_initial_schema.sql');
    console.error('   3. Click "Run"');
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected');

    const migrationDir = path.resolve(__dirname, '../../supabase/migrations');
    const files = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      console.log(`📄 Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationDir, file), 'utf-8');
      await client.query(sql);
      console.log(`✅ ${file} completed`);
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    if (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED')) {
      console.error('   Check your SUPABASE_DB_URL connection string.');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();

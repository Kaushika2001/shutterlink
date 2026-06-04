/**
 * Applies messages + notifications migrations to Supabase Postgres.
 *
 * Usage (from backend/):
 *   npm run db:messaging
 *
 * Requires in backend/.env:
 *   SUPABASE_DB_URL — Supabase Dashboard → Project Settings → Database → Connection string (URI)
 *   Use "Session" mode, replace [YOUR-PASSWORD] with your database password.
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

const MIGRATIONS = [
  '018_ensure_messages_and_notifications.sql',
  '021_enable_messages_realtime.sql',
];

async function runFile(client: Client, filename: string) {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ○ skip ${filename} (file not found)`);
    return;
  }
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`  → ${filename}`);
  await client.query(sql);
  console.log(`  ✓ ${filename}`);
}

async function main() {
  if (!dbUrl || dbUrl.includes('localhost') || dbUrl.includes('password@localhost')) {
    console.error(`
Cannot apply migrations automatically: SUPABASE_DB_URL is not set in backend/.env

Option A — CLI (this script):
  1. Supabase Dashboard → Project Settings → Database → Connection string → URI (Session)
  2. Add to backend/.env:
     SUPABASE_DB_URL=postgresql://postgres.[ref]:[PASSWORD]@...
  3. Run: npm run db:messaging

Option B — SQL Editor (no password needed):
  1. Open Supabase → SQL Editor
  2. Paste and run: backend/supabase/RUN_MESSAGING_SETUP.sql
`);
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('\nShutterLink — messaging migrations\n');
    for (const file of MIGRATIONS) {
      await runFile(client, file);
    }
    console.log('\nDone. Verify: http://localhost:5000/api/health/schema\n');
  } catch (err: any) {
    console.error('\nMigration failed:', err.message || err);
    console.error('\nUse Option B: run backend/supabase/RUN_MESSAGING_SETUP.sql in Supabase SQL Editor.\n');
    process.exit(1);
  } finally {
    await client.end();
  }
}

void main();

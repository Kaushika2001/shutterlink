/**
 * Clears all public app data + Supabase Auth users for a fresh manual test.
 *
 * Usage (from backend folder):
 *   npx ts-node scripts/reset-test-data.ts
 *
 * Requires in backend/.env:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TABLES = [
  'messages',
  'notifications',
  'reviews',
  'payments',
  'disputes',
  'audit_logs',
  'password_resets',
  'saved_providers',
  'blocked_dates',
  'availability_schedules',
  'bookings',
  'portfolio_items',
  'service_packages',
  'provider_profiles',
  'users',
];

async function clearTable(table: string) {
  const { error, count } = await supabase
    .from(table)
    .delete({ count: 'exact' })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    if (error.message.includes('Could not find the table') || error.message.includes('schema cache')) {
      console.log(`  ○ ${table} (table not found — skip)`);
      return;
    }
    console.error(`  ✗ ${table}: ${error.message}`);
    return;
  }
  console.log(`  ✓ ${table} (${count ?? 0} rows removed)`);
}

async function deleteAllAuthUsers() {
  let page = 1;
  let total = 0;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) {
      console.error('Auth list users failed:', error.message);
      return;
    }

    const users = data?.users || [];
    if (users.length === 0) break;

    for (const user of users) {
      const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
      if (delErr) {
        console.error(`  ✗ auth user ${user.email}: ${delErr.message}`);
      } else {
        total += 1;
      }
    }

    if (users.length < 100) break;
    page += 1;
  }

  console.log(`  ✓ auth.users (${total} accounts removed)`);
}

async function main() {
  console.log('\nShutterLink — reset test data\n');

  console.log('1) Clearing public tables...');
  for (const table of TABLES) {
    await clearTable(table);
  }

  console.log('\n2) Clearing Supabase Auth users (login accounts)...');
  await deleteAllAuthUsers();

  console.log('\nDone. Register new users at http://localhost:3000/register\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

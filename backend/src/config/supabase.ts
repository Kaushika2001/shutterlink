import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from './env';

if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials not found - some operations will fail');
}

const supabaseClientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};

// Public client - uses anon key, respects RLS (for client-side operations)
export const supabase = createClient(
  config.SUPABASE_URL || '',
  config.SUPABASE_ANON_KEY || '',
  supabaseClientOptions
);

export const isServiceRoleConfigured = (): boolean =>
  Boolean(config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY);

/** Server-side client — must use service role to bypass RLS for API writes */
export const supabaseAdmin: SupabaseClient = isServiceRoleConfigured()
  ? createClient(config.SUPABASE_URL!, config.SUPABASE_SERVICE_ROLE_KEY!, supabaseClientOptions)
  : supabase;

export function assertSupabaseAdminConfigured(): void {
  if (!isServiceRoleConfigured()) {
    console.error(
      '\n✗ SUPABASE_SERVICE_ROLE_KEY is missing in backend/.env\n' +
        '  Add it from Supabase Dashboard → Project Settings → API → service_role (secret).\n' +
        '  Without it, bookings and other writes fail with RLS errors (code 42501).\n'
    );
    if (config.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

export default supabase;

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

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    adminClient = isServiceRoleConfigured()
      ? createClient(config.SUPABASE_URL!, config.SUPABASE_SERVICE_ROLE_KEY!, {
          ...supabaseClientOptions,
          global: {
            headers: {
              apikey: config.SUPABASE_SERVICE_ROLE_KEY!,
              Authorization: `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY!}`,
            },
          },
        })
      : supabase;
  }
  return adminClient;
}

/** Reset after env changes (tests / hot reload) */
export function resetSupabaseAdminClient(): void {
  adminClient = null;
}

/** Backwards-compatible export — always resolves the lazy admin client */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseAdmin();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export function assertSupabaseAdminConfigured(): void {
  if (!isServiceRoleConfigured()) {
    console.error(
      '\n✗ SUPABASE_SERVICE_ROLE_KEY is missing in backend/.env\n' +
        '  Add it from Supabase Dashboard → Project Settings → API → service_role (secret).\n' +
        '  Without it, bookings and other writes fail with RLS errors (code 42501).\n'
    );
    if (config.NODE_ENV === 'production' && process.env.VERCEL !== '1') {
      process.exit(1);
    }
    return;
  }

  getSupabaseAdmin();
}

export default supabase;

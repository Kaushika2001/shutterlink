import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getApiBaseUrl } from '@/lib/env';
import { supabaseSessionStorage } from '@/lib/supabase-session';

let client: SupabaseClient | null = null;
let initPromise: Promise<SupabaseClient | null> | null = null;

type PublicConfig = {
  supabase_url: string | null;
  supabase_anon_key: string | null;
};

async function loadPublicConfig(): Promise<PublicConfig> {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (envUrl && envKey) {
    return { supabase_url: envUrl, supabase_anon_key: envKey };
  }

  const res = await fetch(`${getApiBaseUrl()}/config/public`);
  const json = await res.json();
  return json.data || { supabase_url: null, supabase_anon_key: null };
}

export async function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (client) return client;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const cfg = await loadPublicConfig();
    if (!cfg.supabase_url || !cfg.supabase_anon_key) return null;

    client = createClient(cfg.supabase_url, cfg.supabase_anon_key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    });

    const stored = supabaseSessionStorage.get();
    if (stored?.access_token && stored?.refresh_token) {
      await client.auth.setSession({
        access_token: stored.access_token,
        refresh_token: stored.refresh_token,
      });
    }

    return client;
  })();

  return initPromise;
}

export function isRealtimeConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

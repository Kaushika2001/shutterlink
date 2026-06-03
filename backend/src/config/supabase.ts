import { createClient } from '@supabase/supabase-js';
import config from './env';

if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials not found - some operations will fail');
}

// Public client - uses anon key, respects RLS (for client-side operations)
export const supabase = createClient(
  config.SUPABASE_URL || '',
  config.SUPABASE_ANON_KEY || ''
);

// Admin client - uses service role key, bypasses RLS (for server-side operations)
export const supabaseAdmin = config.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(config.SUPABASE_URL || '', config.SUPABASE_SERVICE_ROLE_KEY)
  : supabase;

export default supabase;

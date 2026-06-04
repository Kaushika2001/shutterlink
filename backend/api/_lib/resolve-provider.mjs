import { getSupabaseAdmin } from './supabase.mjs';

/** availability_schedules.provider_id = auth user id */
export async function resolveProviderUserId(providerIdOrUserId) {
  const supabase = getSupabaseAdmin();

  const { data: byProfileId } = await supabase
    .from('provider_profiles')
    .select('user_id')
    .eq('id', providerIdOrUserId)
    .maybeSingle();

  if (byProfileId?.user_id) return byProfileId.user_id;

  const { data: byUserId } = await supabase
    .from('provider_profiles')
    .select('user_id')
    .eq('user_id', providerIdOrUserId)
    .maybeSingle();

  return byUserId?.user_id || providerIdOrUserId;
}

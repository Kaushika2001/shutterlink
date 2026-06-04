import { getSupabaseAdmin } from './supabase.mjs';

export async function getPublicProviderDetails(providerId) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('provider_profiles')
    .select(`*, user:users(id,name,email), portfolio_items(*), service_packages(*)`)
    .eq('id', providerId)
    .single();

  if (error || !data) {
    const err = new Error('Provider not found');
    err.statusCode = 404;
    throw err;
  }

  const packages = (data.service_packages || []).filter((p) => p.is_active !== false);
  return { ...data, service_packages: packages };
}

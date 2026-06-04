import { applyCors, handleOptions, sendJson } from '../_lib/http.mjs';
import { getSupabaseAdmin } from '../_lib/supabase.mjs';

export default async function handler(req, res) {
  applyCors(req, res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    sendJson(res, 405, { success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('service_packages')
      .select('*, provider:provider_profiles!inner(*)')
      .eq('is_active', true)
      .order('price');

    if (error) {
      sendJson(res, 400, { success: false, error: error.message });
      return;
    }

    sendJson(res, 200, { success: true, data: data || [] });
  } catch (err) {
    console.error('packages/search:', err);
    sendJson(res, 500, { success: false, error: err.message || 'Failed to search packages' });
  }
}

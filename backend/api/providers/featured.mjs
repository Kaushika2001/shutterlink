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
    const url = new URL(req.url || '/', 'http://localhost');
    const limit = Math.min(Number(url.searchParams.get('limit')) || 6, 50);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('provider_profiles')
      .select('*')
      .eq('is_verified', true)
      .order('average_rating', { ascending: false })
      .limit(limit);

    if (error) {
      sendJson(res, 400, { success: false, error: 'Failed to fetch featured providers' });
      return;
    }

    sendJson(res, 200, { success: true, data: data || [] });
  } catch (err) {
    console.error('providers/featured:', err);
    sendJson(res, 500, { success: false, error: err.message || 'Failed to fetch providers' });
  }
}

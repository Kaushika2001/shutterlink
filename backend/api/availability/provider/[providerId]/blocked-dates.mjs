import { applyCors, handleOptions, sendJson } from '../../../_lib/http.mjs';
import { getSupabaseAdmin } from '../../../_lib/supabase.mjs';
import { resolveProviderUserId } from '../../../_lib/resolve-provider.mjs';

export default async function handler(req, res) {
  applyCors(req, res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    sendJson(res, 405, { success: false, error: 'Method not allowed' });
    return;
  }

  const providerId = req.query?.providerId;
  if (!providerId) {
    sendJson(res, 400, { success: false, error: 'Provider ID is required' });
    return;
  }

  try {
    const supabase = getSupabaseAdmin();
    const providerUserId = await resolveProviderUserId(providerId);
    const { data, error } = await supabase
      .from('blocked_dates')
      .select('*')
      .eq('provider_id', providerUserId)
      .order('blocked_date');

    if (error) {
      sendJson(res, 400, { success: false, error: error.message || 'Failed to fetch blocked dates' });
      return;
    }

    sendJson(res, 200, { success: true, data: data || [] });
  } catch (err) {
    console.error('availability/blocked-dates:', err);
    sendJson(res, 500, { success: false, error: err.message || 'Failed to fetch blocked dates' });
  }
}

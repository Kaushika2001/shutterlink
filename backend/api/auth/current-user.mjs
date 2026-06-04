import { applyCors, getBearerToken, handleOptions, sendJson } from '../_lib/http.mjs';
import { getSupabaseAdmin } from '../_lib/supabase.mjs';
import { verifyToken } from '../_lib/jwt.mjs';

export default async function handler(req, res) {
  applyCors(req, res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    sendJson(res, 405, { success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const token = getBearerToken(req);
    if (!token) {
      sendJson(res, 401, { success: false, error: 'Unauthorized' });
      return;
    }

    const payload = verifyToken(token);
    const supabase = getSupabaseAdmin();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single();

    if (error || !user) {
      sendJson(res, 404, { success: false, error: 'User not found' });
      return;
    }

    sendJson(res, 200, { success: true, data: user });
  } catch (err) {
    sendJson(res, 401, { success: false, error: 'Unauthorized' });
  }
}

import { applyCors, handleOptions, readJsonBody, sendJson } from '../_lib/http.mjs';
import { getSupabaseAdmin } from '../_lib/supabase.mjs';
import { signToken } from '../_lib/jwt.mjs';

export default async function handler(req, res) {
  applyCors(req, res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    sendJson(res, 405, { success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = body.password;
    if (!email || !password) {
      sendJson(res, 400, { success: false, error: 'Email and password are required' });
      return;
    }

    const supabase = getSupabaseAdmin();
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !authData.user) {
      sendJson(res, 401, { success: false, error: 'Invalid email or password' });
      return;
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError || !user) {
      sendJson(res, 404, { success: false, error: 'User not found' });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    sendJson(res, 200, {
      success: true,
      data: {
        user,
        token,
        supabase_session: authData.session
          ? {
              access_token: authData.session.access_token,
              refresh_token: authData.session.refresh_token,
            }
          : null,
      },
      message: 'Login successful',
    });
  } catch (err) {
    console.error('login:', err);
    sendJson(res, 500, { success: false, error: err.message || 'Login failed' });
  }
}

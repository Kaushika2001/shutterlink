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
    const name = String(body.name || '').trim();
    const role = body.role;
    const phone = body.phone;

    if (!email || !password || name.length < 2) {
      sendJson(res, 400, { success: false, error: 'Invalid registration data' });
      return;
    }
    if (role !== 'customer' && role !== 'provider') {
      sendJson(res, 400, { success: false, error: 'Role must be customer or provider' });
      return;
    }
    if (password.length < 8) {
      sendJson(res, 400, { success: false, error: 'Password must be at least 8 characters' });
      return;
    }

    const supabase = getSupabaseAdmin();

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      sendJson(res, 409, { success: false, error: 'User with this email already exists' });
      return;
    }

    const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError || !authData.user) {
      sendJson(res, 400, { success: false, error: signUpError?.message || 'Failed to create user' });
      return;
    }

    const { error: insertError } = await supabase.from('users').insert([
      {
        id: authData.user.id,
        email,
        name,
        role,
        phone,
        is_verified: false,
      },
    ]);

    if (insertError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      sendJson(res, 400, { success: false, error: 'Failed to create user' });
      return;
    }

    const token = signToken({ userId: authData.user.id, email, role });
    const user = {
      id: authData.user.id,
      email,
      name,
      role,
      phone,
      is_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    sendJson(res, 201, {
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
      message: 'Registration successful',
    });
  } catch (err) {
    console.error('register:', err);
    sendJson(res, 500, { success: false, error: err.message || 'Registration failed' });
  }
}

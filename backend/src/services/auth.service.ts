import { supabaseAdmin } from '../config/supabase';
import { generateToken } from '../utils/jwt';
import { User, RegisterPayload, LoginPayload, AuthResponse } from '../types';
import { ValidationError, NotFoundError, AuthenticationError, ConflictError } from '../utils/errors';

export class AuthService {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { email, password, name, role, phone } = payload;

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const { data: authData, error: signUpError } = await supabaseAdmin.auth.signUp({
      email: email.toLowerCase(),
      password,
    });

    if (signUpError || !authData.user) {
      throw new ValidationError(signUpError?.message || 'Failed to create user');
    }

    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: email.toLowerCase(),
          name,
          role,
          phone,
          is_verified: false,
        },
      ])
      .select()
      .single();

    if (insertError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new ValidationError('Failed to create user');
    }

    const token = generateToken({
      userId: authData.user.id,
      email: email.toLowerCase(),
      role,
    });

    const user: User = {
      id: authData.user.id,
      email: email.toLowerCase(),
      name,
      role: role as User['role'],
      phone,
      is_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return {
      user,
      token,
      supabase_session: authData.session
        ? {
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
          }
        : null,
    };
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { email, password } = payload;

    const { data: authData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (signInError || !authData.user) {
      throw new AuthenticationError('Invalid email or password');
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError || !user) {
      throw new NotFoundError('User not found');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: user as User,
      token,
      supabase_session: authData.session
        ? {
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
          }
        : null,
    };
  }

  async getCurrentUser(userId: string): Promise<User> {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new NotFoundError('User not found');
    }

    return user as User;
  }

  /** Issue a fresh JWT using the user's current DB role (fixes stale tokens after role changes). */
  async refreshSession(userId: string): Promise<Pick<AuthResponse, 'user' | 'token'>> {
    const user = await this.getCurrentUser(userId);
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    return { user, token };
  }

  async getUserById(userId: string): Promise<User> {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new NotFoundError('User not found');
    }

    return user as User;
  }

  async logout(userId: string): Promise<void> {
    // Stateless JWT - client-side token removal is sufficient.
    // This can be extended with a token blacklist if needed.
  }

  async requestPasswordReset(email: string): Promise<{ message: string; resetToken?: string }> {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (!user) {
      return { message: 'If that email exists, a reset link has been sent' };
    }

    const token = `${Date.now()}-${Math.random().toString(36).slice(2, 15)}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await supabaseAdmin.from('password_resets').delete().eq('user_id', user.id);

    const { error: tokenError } = await supabaseAdmin.from('password_resets').insert({
      user_id: user.id,
      token,
      expires_at: expiresAt,
    });

    if (tokenError) {
      await supabaseAdmin.auth.resetPasswordForEmail(email.toLowerCase());
      return { message: 'If that email exists, a reset link has been sent' };
    }

    try {
      await supabaseAdmin.auth.resetPasswordForEmail(email.toLowerCase());
    } catch {
      /* optional email */
    }

    const response: { message: string; resetToken?: string } = {
      message: 'If that email exists, a reset link has been sent',
    };
    if (process.env.NODE_ENV === 'development') {
      response.resetToken = token;
    }
    return response;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const { data: reset, error: resetError } = await supabaseAdmin
      .from('password_resets')
      .select('user_id, expires_at')
      .eq('token', token)
      .single();

    if (resetError || !reset) {
      throw new ValidationError('Invalid or expired reset token');
    }

    if (new Date(reset.expires_at) < new Date()) {
      throw new ValidationError('Reset token has expired');
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      reset.user_id,
      { password: newPassword }
    );

    if (updateError) {
      throw new ValidationError('Failed to reset password');
    }

    await supabaseAdmin
      .from('password_resets')
      .delete()
      .eq('token', token);
  }
}

export const authService = new AuthService();

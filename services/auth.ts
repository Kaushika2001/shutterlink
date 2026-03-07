import { supabase } from '@/lib/supabaseClient';
import type { UserRole } from '@/types';

/* =========================
   REGISTER USER
========================= */
export const signUp = async (
  email: string,
  password: string,
  name: string,
  role: UserRole,
  contactNumber?: string
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      throw new Error('Email already registered. Please login.');
    }
    throw error;
  }

  if (!data.user) {
    throw new Error('User creation failed. Please try again.');
  }

  const { error: insertError } = await supabase.from('users').insert({
    id: data.user.id,
    email,
    name,
    role,
    contact_number: contactNumber,
  });

  if (insertError) {
    if (insertError.code === '23505') {
      throw new Error('Email already registered. Please login.');
    }
    throw insertError;
  }

  return data.user;
};

/* =========================
   LOGIN USER
========================= */
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error('Invalid email or password.');
  }

  if (!data.user) {
    throw new Error('Login failed. User not found.');
  }

  return data.user;
};

/* =========================
   LOGOUT USER
========================= */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error('Logout failed. Please try again.');
  }
};

/* =========================
   GET CURRENT AUTH USER
========================= */
export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};

/* =========================
   GET CURRENT USER ROLE
========================= */
export const getUserRole = async (): Promise<UserRole | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data.role as UserRole;
};

/* =========================
   GET USER BY ID
========================= */
export const getUserById = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

/* =========================
   RESET PASSWORD
========================= */
export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
};

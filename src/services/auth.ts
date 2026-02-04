import { supabase } from '@/lib/supabaseClient';

/* =========================
   REGISTER USER
========================= */
export const signUp = async (
  email: string,
  password: string,
  name: string,
  role: 'customer' | 'provider' | 'admin'
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

  return data.user; // ✅ CORRECT
};

/* =========================
   LOGOUT USER
========================= */
export const signOut = async () => {
  await supabase.auth.signOut();
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
export const getUserRole = async (): Promise<
  'customer' | 'provider' | 'admin' | null
> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle(); // ✅ FIXED

  if (error || !data) return null;
  return data.role;
};

/* =========================
   GET USER ROLE BY ID (USED AFTER LOGIN)
========================= */
export const getUserRoleById = async (
  userId: string
): Promise<'customer' | 'provider' | 'admin'> => {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle(); // ✅ FIXED

  if (error || !data) {
    throw new Error('User role not found');
  }

  return data.role;
};

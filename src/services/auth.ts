import { supabase } from '@/lib/supabaseClient';

// REGISTER USER
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

  if (error) throw error;

  // Insert into public.users table
  const { error: insertError } = await supabase.from('users').insert([
    {
      id: data.user?.id,
      email,
      name,
      role,
    },
  ]);

  if (insertError) throw insertError;

  return data;
};

// LOGIN USER
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

// LOGOUT
export const signOut = async () => {
  await supabase.auth.signOut();
};

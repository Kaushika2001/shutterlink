import { apiRequest, tokenStorage } from '@/lib/api';
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
  const data = await apiRequest<{ user: any; token: string }>(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        name,
        role,
        phone: contactNumber,
      }),
    }
  );
  tokenStorage.set(data.token);
  return data.user;
};

/* =========================
   LOGIN USER
========================= */
export const signIn = async (email: string, password: string) => {
  const data = await apiRequest<{ user: any; token: string }>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }
  );
  tokenStorage.set(data.token);
  return data.user;
};

/* =========================
   LOGOUT USER
========================= */
export const signOut = async () => {
  tokenStorage.clear();
};

/* =========================
   GET CURRENT AUTH USER
========================= */
export const getCurrentUser = async () => {
  try {
    return await apiRequest<any>('/auth/current-user', {}, true);
  } catch {
    return null;
  }
};

/* =========================
   GET CURRENT USER ROLE
========================= */
export const getUserRole = async (): Promise<UserRole | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  return user.role as UserRole;
};

/* =========================
   GET USER BY ID
========================= */
export const getUserById = async (userId: string) => {
  return await apiRequest<any>(`/auth/user/${userId}`);
};

/* =========================
   RESET PASSWORD
========================= */
export const requestPasswordReset = async (email: string) => {
  return await apiRequest<{ resetToken?: string }>(
    '/auth/request-password-reset',
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    }
  );
};

export const resetPasswordWithToken = async (token: string, newPassword: string) => {
  await apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
};

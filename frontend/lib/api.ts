const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'shutterlink_token';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export const tokenStorage = {
  get(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },
};

export async function apiRequest<T>(path: string, init: RequestInit = {}, requireAuth = false): Promise<T> {
  const token = tokenStorage.get();
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');

  if (requireAuth) {
    if (!token) {
      throw new Error('Please log in again');
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  let payload: ApiResponse<T>;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error(response.ok ? 'Invalid server response' : `Request failed (${response.status})`);
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || payload.message || 'Request failed');
  }

  return (payload.data ?? null) as T;
}


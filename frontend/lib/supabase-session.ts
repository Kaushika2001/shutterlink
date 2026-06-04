const SUPABASE_SESSION_KEY = 'shutterlink_supabase_session';

export type StoredSupabaseSession = {
  access_token: string;
  refresh_token: string;
};

export const supabaseSessionStorage = {
  get(): StoredSupabaseSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(SUPABASE_SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as StoredSupabaseSession;
    } catch {
      return null;
    }
  },
  set(session: StoredSupabaseSession) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SUPABASE_SESSION_KEY, JSON.stringify(session));
  },
  clear() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SUPABASE_SESSION_KEY);
  },
};

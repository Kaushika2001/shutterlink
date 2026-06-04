/**
 * API base URL for all browser requests.
 * On Vercel (same deployment): defaults to /api (same origin).
 * Override with NEXT_PUBLIC_API_URL if using a separate API host.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (raw) return raw.replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api`;
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[ShutterLink] NEXT_PUBLIC_API_URL not set; use /api on same Vercel deployment or set the env var.'
    );
  }

  return 'http://localhost:5000/api';
}

export function isApiConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
      process.env.VERCEL_URL ||
      (typeof window !== 'undefined' && window.location.origin)
  );
}

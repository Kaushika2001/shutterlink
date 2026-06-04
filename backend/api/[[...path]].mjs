/**
 * Express fallback for routes without a thin handler (bookings, payments, admin, etc.).
 * Hot paths use dedicated files under api/ so they avoid this bundle.
 */
let expressHandler = null;

async function loadExpress() {
  if (!expressHandler) {
    const mod = await import('./express-bundle.cjs');
    expressHandler = mod.default;
  }
  return expressHandler;
}

export default async function handler(req, res) {
  try {
    const fn = await loadExpress();
    return fn(req, res);
  } catch (err) {
    console.error('Express fallback error:', err);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        error: 'API failed to start. Check Vercel build logs for build:vercel.',
      })
    );
  }
}

export const config = {
  api: { bodyParser: false },
  maxDuration: 10,
};

/**
 * Vercel serverless — all /api/* except /api/health (static file via vercel.json routes).
 */
let expressHandler = null;

async function loadExpress() {
  if (!expressHandler) {
    const mod = await import('./express-bundle.cjs');
    expressHandler = mod.default;
  }
  return expressHandler;
}

module.exports = async (req, res) => {
  try {
    const handler = await loadExpress();
    return handler(req, res);
  } catch (err) {
    console.error('API load error:', err);
    res.status(503);
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        error: 'API failed to start. Check Vercel build logs for build:vercel.',
      })
    );
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 10,
};

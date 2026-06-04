/**
 * Single Vercel function for all /api/* (via rewrite).
 * /api/health returns instantly — Express loads only for other routes.
 */

const HEALTH_PATHS = new Set(['/api/health', '/health']);

function isHealthCheck(url) {
  const path = (url || '/').split('?')[0];
  return HEALTH_PATHS.has(path) || path.endsWith('/health');
}

function sendHealth(res) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).end(
    JSON.stringify({
      status: 'OK',
      runtime: 'vercel-inline-health',
      timestamp: new Date().toISOString(),
    })
  );
}

let expressHandler = null;

function getExpressHandler() {
  if (!expressHandler) {
    // eslint-disable-next-line global-require, import/no-unresolved
    expressHandler = require('./express-bundle.cjs');
  }
  return expressHandler;
}

module.exports = async (req, res) => {
  if (isHealthCheck(req.url)) {
    sendHealth(res);
    return;
  }
  const handler = getExpressHandler();
  return handler(req, res);
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 10,
};

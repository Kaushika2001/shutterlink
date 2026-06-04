/**
 * All /api/* except /api/health (handled by api/health.js).
 * No vercel.json rewrites — avoids req.url becoming "/api" only.
 */
let expressHandler = null;

function loadHandler() {
  if (!expressHandler) {
    // eslint-disable-next-line global-require
    expressHandler = require('./express-bundle.cjs');
  }
  return expressHandler;
}

module.exports = async (req, res) => {
  const handler = loadHandler();
  return handler(req, res);
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 10,
};

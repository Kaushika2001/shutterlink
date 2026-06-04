/** Shared HTTP helpers for thin Vercel routes (no Express). */

export function applyCors(req, res) {
  const raw = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '';
  const allowed = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const origin = req.headers.origin;
  if (!origin) return;

  const ok =
    allowed.includes(origin) ||
    (process.env.ALLOW_VERCEL_PREVIEW_ORIGINS === 'true' && /\.vercel\.app$/i.test(origin)) ||
    process.env.NODE_ENV !== 'production';

  if (ok) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    applyCors(req, res);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

export function getBearerToken(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

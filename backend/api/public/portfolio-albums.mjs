import { applyCors, handleOptions, sendJson } from '../_lib/http.mjs';
import { getPublicPortfolioAlbums } from '../_lib/portfolio-albums.mjs';

export default async function handler(req, res) {
  applyCors(req, res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    sendJson(res, 405, { success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const data = await getPublicPortfolioAlbums();
    sendJson(res, 200, { success: true, data });
  } catch (err) {
    console.error('portfolio-albums:', err);
    sendJson(res, 500, { success: false, error: err.message || 'Failed to load albums' });
  }
}

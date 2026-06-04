import { applyCors, handleOptions, sendJson } from '../../_lib/http.mjs';
import { getProviderReviews } from '../../_lib/reviews-provider.mjs';

export default async function handler(req, res) {
  applyCors(req, res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    sendJson(res, 405, { success: false, error: 'Method not allowed' });
    return;
  }

  const providerId = req.query?.providerId;
  if (!providerId) {
    sendJson(res, 400, { success: false, error: 'Provider ID is required' });
    return;
  }

  try {
    const data = await getProviderReviews(providerId);
    sendJson(res, 200, { success: true, data });
  } catch {
    sendJson(res, 200, { success: true, data: [] });
  }
}

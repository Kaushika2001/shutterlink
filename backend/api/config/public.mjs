import { applyCors, handleOptions, sendJson } from '../_lib/http.mjs';

function isPaymentSandboxMode() {
  return (
    process.env.PAYMENT_SANDBOX_MODE === 'true' ||
    (process.env.PAYMENT_SANDBOX_MODE !== 'false' && process.env.NODE_ENV !== 'production')
  );
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    sendJson(res, 405, { success: false, error: 'Method not allowed' });
    return;
  }

  sendJson(res, 200, {
    success: true,
    data: {
      supabase_url: process.env.SUPABASE_URL || null,
      supabase_anon_key: process.env.SUPABASE_ANON_KEY || null,
      payment_sandbox_mode: isPaymentSandboxMode(),
      payhere_sandbox: process.env.PAYHERE_SANDBOX !== 'false',
    },
  });
}

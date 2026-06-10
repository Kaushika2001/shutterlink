import { Router } from 'express';
import config, { isPaymentSandboxMode } from '../config/env';

export const configRoutes = Router();

/** Public keys for browser Realtime (anon key only) */
configRoutes.get('/public', (_req, res) => {
  res.json({
    success: true,
    data: {
      supabase_url: config.SUPABASE_URL || null,
      supabase_anon_key: config.SUPABASE_ANON_KEY || null,
      payment_sandbox_mode: isPaymentSandboxMode(),
      stripe_publishable_key: config.STRIPE_PUBLISHABLE_KEY || null,
      stripe_configured: Boolean(config.STRIPE_SECRET_KEY),
    },
  });
});

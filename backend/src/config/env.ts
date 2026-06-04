import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

function loadEnvFile() {
  const candidates = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'backend', '.env'),
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '.env'),
  ];
  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      return envPath;
    }
  }
  dotenv.config();
  return null;
}

loadEnvFile();

const DEFAULT_JWT = 'your-secret-key-min-32-chars-long';

function getVercelAppUrl(): string | null {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return null;
}

/** Comma-separated CORS_ORIGIN or FRONTEND_URL — first entry used for payment return URL default */
export function getCorsOriginList(): string[] {
  const raw =
    process.env.CORS_ORIGIN ||
    process.env.FRONTEND_URL ||
    (getVercelAppUrl() ?? 'http://localhost:3000');
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const extra of [
    getVercelAppUrl(),
    process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : null,
  ]) {
    if (extra && !list.includes(extra)) list.push(extra);
  }
  return list;
}

const corsOrigins = getCorsOriginList();
const primaryFrontendUrl = corsOrigins[0] || getVercelAppUrl() || 'http://localhost:3000';
const defaultWebhookBase =
  process.env.PAYMENT_WEBHOOK_BASE_URL || getVercelAppUrl() || 'http://localhost:5000';

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  HOST: process.env.HOST || '0.0.0.0',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || DEFAULT_JWT,
  JWT_EXPIRY: '24h',
  CORS_ORIGIN: primaryFrontendUrl,
  CORS_ORIGINS: corsOrigins,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_BUCKET: 'portfolio-images',
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET || 'shutterlink_portfolio',
  /** Portfolio image storage: "cloudinary" (default) or "supabase" */
  PORTFOLIO_STORAGE: (process.env.PORTFOLIO_STORAGE || 'cloudinary').toLowerCase(),
  // OnePay — https://developer.onepay.lk
  ONEPAY_APP_ID: process.env.ONEPAY_APP_ID || '',
  ONEPAY_APP_TOKEN: process.env.ONEPAY_APP_TOKEN || '',
  ONEPAY_HASH_SALT: process.env.ONEPAY_HASH_SALT || '',
  ONEPAY_HASH_TOKEN: process.env.ONEPAY_HASH_TOKEN || '',
  // PayHere (HelaPay / card IPG) — https://support.payhere.lk
  PAYHERE_MERCHANT_ID: process.env.PAYHERE_MERCHANT_ID || '',
  PAYHERE_MERCHANT_SECRET: process.env.PAYHERE_MERCHANT_SECRET || '',
  PAYHERE_SANDBOX: process.env.PAYHERE_SANDBOX !== 'false',
  PAYMENT_WEBHOOK_BASE_URL: defaultWebhookBase,
  PAYMENT_RETURN_URL:
    process.env.PAYMENT_RETURN_URL ||
    `${primaryFrontendUrl.replace(/\/$/, '')}/dashboard/payments/return`,
  PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET || '',
  /** When true, checkout uses simulate/sandbox flow (no live gateway charges). Default on in development. */
  PAYMENT_SANDBOX_MODE:
    process.env.PAYMENT_SANDBOX_MODE === 'true' ||
    (process.env.PAYMENT_SANDBOX_MODE !== 'false' && process.env.NODE_ENV !== 'production'),
};

export const isPaymentSandboxMode = (): boolean => config.PAYMENT_SANDBOX_MODE;

export const isCloudinaryConfigured = (): boolean =>
  Boolean(config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET);

export type EnvCheckItem = { key: string; ok: boolean; required: boolean; hint?: string };

export function getEnvChecklist(): EnvCheckItem[] {
  const isProd = config.NODE_ENV === 'production';
  const jwtOk =
    Boolean(config.JWT_SECRET) &&
    config.JWT_SECRET.length >= 32 &&
    config.JWT_SECRET !== DEFAULT_JWT;

  return [
    { key: 'SUPABASE_URL', ok: Boolean(config.SUPABASE_URL), required: true },
    { key: 'SUPABASE_ANON_KEY', ok: Boolean(config.SUPABASE_ANON_KEY), required: true },
    {
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      ok: Boolean(config.SUPABASE_SERVICE_ROLE_KEY),
      required: true,
      hint: 'Required for API writes (bookings, messages, etc.)',
    },
    { key: 'JWT_SECRET', ok: jwtOk, required: isProd, hint: 'Min 32 chars, not the example value' },
    {
      key: 'CORS_ORIGIN or FRONTEND_URL',
      ok:
        corsOrigins.length > 0 &&
        (corsOrigins.some((o) => !o.includes('localhost')) ||
          process.env.ALLOW_VERCEL_PREVIEW_ORIGINS === 'true' ||
          process.env.VERCEL === '1'),
      required: isProd && process.env.VERCEL !== '1',
      hint: 'Production app URL, or deploy on Vercel (auto CORS)',
    },
    {
      key: 'PAYMENT_WEBHOOK_BASE_URL',
      ok: Boolean(config.PAYMENT_WEBHOOK_BASE_URL) && config.PAYMENT_WEBHOOK_BASE_URL.startsWith('https://'),
      required: isProd && !config.PAYMENT_SANDBOX_MODE,
      hint: 'Public HTTPS URL of this API (no /api suffix)',
    },
    {
      key: 'CLOUDINARY (if PORTFOLIO_STORAGE=cloudinary)',
      ok: config.PORTFOLIO_STORAGE !== 'cloudinary' || isCloudinaryConfigured(),
      required: config.PORTFOLIO_STORAGE === 'cloudinary',
    },
  ];
}

export function validateProductionEnv(): string[] {
  if (config.NODE_ENV !== 'production') return [];
  return getEnvChecklist()
    .filter((item) => item.required && !item.ok)
    .map((item) => item.hint ? `${item.key}: ${item.hint}` : item.key);
}

export default config;

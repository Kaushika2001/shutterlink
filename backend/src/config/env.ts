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

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long',
  JWT_EXPIRY: '24h',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
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
  PAYMENT_WEBHOOK_BASE_URL: process.env.PAYMENT_WEBHOOK_BASE_URL || 'http://localhost:5000',
  PAYMENT_RETURN_URL:
    process.env.PAYMENT_RETURN_URL || `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/dashboard/payments/return`,
  PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET || '',
};

export const isCloudinaryConfigured = (): boolean =>
  Boolean(config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET);

export default config;

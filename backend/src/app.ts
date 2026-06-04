import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import config, {
  getEnvChecklist,
  isCloudinaryConfigured,
  isPaymentSandboxMode,
  validateProductionEnv,
} from './config/env';
import { isServiceRoleConfigured } from './config/supabase';
import { corsConfig } from './middleware/corsConfig';
import { errorHandler } from './middleware/errorHandler';

const isVercel = process.env.VERCEL === '1';

function bootstrapChecks(): void {
  const { assertSupabaseAdminConfigured } = require('./config/supabase');
  assertSupabaseAdminConfigured();
  const prodIssues = validateProductionEnv();
  if (prodIssues.length === 0) return;

  if (isVercel) {
    console.warn('[ShutterLink] Production env warnings on Vercel:', prodIssues.join('; '));
    return;
  }

  if (config.NODE_ENV === 'production') {
    console.error('\n✗ Production environment incomplete:\n');
    prodIssues.forEach((issue) => console.error(`  - ${issue}`));
    process.exit(1);
  }
}

function registerRoutes(app: Express): void {
  const { configRoutes } = require('./routes/config.routes');
  const { authRoutes } = require('./routes/auth.routes');
  const { providerRoutes } = require('./routes/provider.routes');
  const { bookingRoutes } = require('./routes/booking.routes');
  const { marketplaceRoutes } = require('./routes/marketplace.routes');
  const { reviewRoutes } = require('./routes/review.routes');
  const { paymentRoutes } = require('./routes/payment.routes');
  const { availabilityRoutes } = require('./routes/availability.routes');
  const { notificationRoutes } = require('./routes/notification.routes');
  const { messagingRoutes } = require('./routes/messaging.routes');
  const { portfolioRoutes } = require('./routes/portfolio.routes');
  const { adminRoutes } = require('./routes/admin.routes');

  app.use('/api/config', configRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/providers', providerRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api', marketplaceRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/availability', availabilityRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/messages', messagingRoutes);
  app.use('/api/portfolio', portfolioRoutes);
  app.use('/api/admin', adminRoutes);
}

export function createApp(): Express {
  const app = express();

  app.use(cors(corsConfig));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    const envIssues = validateProductionEnv();
    res.json({
      status: envIssues.length === 0 ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      runtime: isVercel ? 'vercel-serverless' : 'node',
      cors_origins: config.CORS_ORIGINS,
      portfolio_storage: config.PORTFOLIO_STORAGE,
      cloudinary_configured: isCloudinaryConfigured(),
      supabase_service_role: isServiceRoleConfigured(),
      payment_sandbox_mode: isPaymentSandboxMode(),
      payment_return_url: config.PAYMENT_RETURN_URL,
      env_checklist: getEnvChecklist(),
      production_env_issues: envIssues,
    });
  });

  app.get('/api/health/schema', async (_req: Request, res: Response) => {
    const { supabaseAdmin } = await import('./config/supabase');
    const tables = [
      'bookings',
      'messages',
      'notifications',
      'payments',
      'reviews',
      'availability_schedules',
      'blocked_dates',
    ];
    const status: Record<string, boolean> = {};
    for (const table of tables) {
      const { error } = await supabaseAdmin.from(table).select('id').limit(1);
      status[table] = !error;
    }
    const { error: reviewsProviderCol } = await supabaseAdmin
      .from('reviews')
      .select('provider_id')
      .limit(1);
    status.reviews_provider_id_column = !reviewsProviderCol;
    res.json({ success: true, tables: status });
  });

  registerRoutes(app);

  app.use(errorHandler);

  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found', path: req.path });
  });

  return app;
}

let appInstance: Express | null = null;

/** Lazy singleton — avoids loading all routes until first API request on Vercel */
export default function getApp(): Express {
  if (!appInstance) {
    bootstrapChecks();
    appInstance = createApp();
  }
  return appInstance;
}

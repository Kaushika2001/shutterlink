import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import config, {
  getEnvChecklist,
  isCloudinaryConfigured,
  isPaymentSandboxMode,
  validateProductionEnv,
} from './config/env';
import { assertSupabaseAdminConfigured, isServiceRoleConfigured } from './config/supabase';
import { corsConfig } from './middleware/corsConfig';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth.routes';
import { providerRoutes } from './routes/provider.routes';
import { bookingRoutes } from './routes/booking.routes';
import { marketplaceRoutes } from './routes/marketplace.routes';
import { reviewRoutes } from './routes/review.routes';
import { paymentRoutes } from './routes/payment.routes';
import { availabilityRoutes } from './routes/availability.routes';
import { notificationRoutes } from './routes/notification.routes';
import { messagingRoutes } from './routes/messaging.routes';
import { portfolioRoutes } from './routes/portfolio.routes';
import { adminRoutes } from './routes/admin.routes';
import { configRoutes } from './routes/config.routes';

const isVercel = process.env.VERCEL === '1';

function bootstrapChecks(): void {
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

  app.use(errorHandler);

  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found', path: req.path });
  });

  return app;
}

bootstrapChecks();

/** Singleton for serverless + local server */
const app = createApp();
export default app;

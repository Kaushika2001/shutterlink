import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import config, { isCloudinaryConfigured } from './config/env';
import { assertSupabaseAdminConfigured, isServiceRoleConfigured } from './config/supabase';
import { isOnepayConfigured, isPayhereConfigured } from './services/gateways';
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

const app: Express = express();

// Middleware
app.use(cors(corsConfig));
// Portfolio uploads send base64 JSON (~7MB for a 5MB image)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    portfolio_storage: config.PORTFOLIO_STORAGE,
    cloudinary_configured: isCloudinaryConfigured(),
    supabase_service_role: isServiceRoleConfigured(),
  });
});

app.get('/api/health/schema', async (_req: Request, res: Response) => {
  const { supabaseAdmin } = await import('./config/supabase');
  const tables = ['bookings', 'messages', 'notifications', 'payments'];
  const status: Record<string, boolean> = {};
  for (const table of tables) {
    const { error } = await supabaseAdmin.from(table).select('id').limit(1);
    status[table] = !error;
  }
  res.json({ success: true, tables: status });
});

// API Routes
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

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = config.PORT;

assertSupabaseAdminConfigured();

app.listen(PORT, () => {
  console.log(`✓ Backend server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${config.NODE_ENV}`);
  console.log(
    isServiceRoleConfigured()
      ? '✓ Supabase admin client: service role (RLS bypass for API writes)'
      : '✗ Supabase admin client: using anon key — bookings will fail RLS until SUPABASE_SERVICE_ROLE_KEY is set'
  );
  if (config.PORTFOLIO_STORAGE === 'cloudinary') {
    console.log(
      isCloudinaryConfigured()
        ? `✓ Portfolio storage: Cloudinary (${config.CLOUDINARY_CLOUD_NAME})`
        : '✗ Portfolio storage: Cloudinary selected but credentials missing in .env'
    );
  } else {
    console.log(`✓ Portfolio storage: Supabase bucket "${config.SUPABASE_BUCKET}"`);
  }
  console.log(
    isOnepayConfigured()
      ? '✓ OnePay gateway configured'
      : '○ OnePay: not configured (simulate mode for onepay)'
  );
  console.log(
    isPayhereConfigured()
      ? '✓ HelaPay/PayHere gateway configured'
      : '○ HelaPay/PayHere: not configured (simulate mode for helapay)'
  );
});

export default app;

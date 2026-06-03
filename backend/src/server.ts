import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import config, { isCloudinaryConfigured } from './config/env';
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
  });
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

app.listen(PORT, () => {
  console.log(`✓ Backend server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${config.NODE_ENV}`);
  if (config.PORTFOLIO_STORAGE === 'cloudinary') {
    console.log(
      isCloudinaryConfigured()
        ? `✓ Portfolio storage: Cloudinary (${config.CLOUDINARY_CLOUD_NAME})`
        : '✗ Portfolio storage: Cloudinary selected but credentials missing in .env'
    );
  } else {
    console.log(`✓ Portfolio storage: Supabase bucket "${config.SUPABASE_BUCKET}"`);
  }
});

export default app;

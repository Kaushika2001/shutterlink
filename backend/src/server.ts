import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import config from './config/env';
import { corsConfig } from './middleware/corsConfig';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth.routes';
import { providerRoutes } from './routes/provider.routes';
import { bookingRoutes } from './routes/booking.routes';
import { marketplaceRoutes } from './routes/marketplace.routes';

const app: Express = express();

// Middleware
app.use(cors(corsConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api', marketplaceRoutes);

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
});

export default app;

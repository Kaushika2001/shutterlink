import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

export const paymentRoutes = Router();

paymentRoutes.get('/me', authenticate, (req, res) => paymentController.getUserPayments(req as any, res));
paymentRoutes.get('/provider', authenticate, (req, res) => paymentController.getProviderPayments(req as any, res));
paymentRoutes.post('/', authenticate, (req, res) => paymentController.createPayment(req as any, res));
paymentRoutes.get('/stats', authenticate, (req, res) => paymentController.getPaymentStats(req as any, res));

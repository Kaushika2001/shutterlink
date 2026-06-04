import { Router } from 'express';
import express from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

export const paymentRoutes = Router();

// Webhooks (no auth — verify signatures inside handlers)
paymentRoutes.post('/webhooks/onepay', (req, res) => paymentController.onepayWebhook(req, res));
paymentRoutes.post(
  '/webhooks/helapay',
  express.urlencoded({ extended: true }),
  (req, res) => paymentController.helapayWebhook(req, res)
);

paymentRoutes.get('/me', authenticate, (req, res) => paymentController.getUserPayments(req as any, res));
paymentRoutes.get('/provider', authenticate, (req, res) => paymentController.getProviderPayments(req as any, res));
paymentRoutes.get('/stats', authenticate, (req, res) => paymentController.getPaymentStats(req as any, res));
paymentRoutes.post('/checkout', authenticate, (req, res) => paymentController.checkout(req as any, res));
paymentRoutes.get('/:paymentId/status', authenticate, (req, res) => paymentController.syncPaymentStatus(req as any, res));
paymentRoutes.post('/:paymentId/complete', authenticate, (req, res) => paymentController.completePayment(req as any, res));
paymentRoutes.post('/', authenticate, (req, res) => paymentController.createPayment(req as any, res));

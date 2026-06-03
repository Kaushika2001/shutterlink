import { Response } from 'express';
import { paymentService } from '../services/payment.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class PaymentController {
  async getUserPayments(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const payments = await paymentService.getUserPayments(req.userId);
      res.status(200).json({ success: true, data: payments });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getProviderPayments(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const payments = await paymentService.getProviderPayments(req.userId);
      res.status(200).json({ success: true, data: payments });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async createPayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const { booking_id, amount, method, payment_type, status, transaction_ref } = req.body;
      const payment = await paymentService.createPayment({
        booking_id,
        payer_id: req.userId,
        amount,
        method,
        payment_type,
        status,
        transaction_ref,
      });
      res.status(201).json({ success: true, data: payment, message: 'Payment created' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getPaymentStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const isProvider = req.query.isProvider === 'true';
      const stats = await paymentService.getPaymentStats(req.userId, isProvider);
      res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }
}

export const paymentController = new PaymentController();

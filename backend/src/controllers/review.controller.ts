import { Request, Response } from 'express';
import { reviewService } from '../services/review.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class ReviewController {
  async getProviderReviews(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.params;
      const reviews = await reviewService.getProviderReviews(providerId);
      res.status(200).json({ success: true, data: reviews });
    } catch (error: any) {
      // Reviews are optional on public pages; return empty list if schema/query fails
      res.status(200).json({ success: true, data: [] });
    }
  }

  async getMyReviews(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const reviews = await reviewService.getUserReviews(req.userId);
      res.status(200).json({ success: true, data: reviews });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getPendingReviews(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const bookings = await reviewService.getPendingReviews(req.userId);
      res.status(200).json({ success: true, data: bookings });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async createReview(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const { booking_id, rating, comment } = req.body;
      const review = await reviewService.createReview(req.userId, { booking_id, rating, comment });
      res.status(201).json({ success: true, data: review, message: 'Review created' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getReviewStats(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.params;
      const stats = await reviewService.getProviderReviewStats(providerId);
      res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }
}

export const reviewController = new ReviewController();

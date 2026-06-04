import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';
import { authenticate } from '../middleware/auth.middleware';

export const reviewRoutes = Router();

reviewRoutes.get('/provider/:providerId', (req, res) => reviewController.getProviderReviews(req, res));
reviewRoutes.get('/me', authenticate, (req, res) => reviewController.getMyReviews(req as any, res));
reviewRoutes.get('/pending', authenticate, (req, res) => reviewController.getPendingReviews(req as any, res));
reviewRoutes.get('/pending/provider/:providerId', authenticate, (req, res) =>
  reviewController.getPendingReviewsForProvider(req as any, res)
);
reviewRoutes.post('/', authenticate, (req, res) => reviewController.createReview(req as any, res));
reviewRoutes.get('/stats/:providerId', (req, res) => reviewController.getReviewStats(req, res));

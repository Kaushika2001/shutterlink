import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { marketplaceController as ctrl } from '../controllers/marketplace.controller';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

export const marketplaceRoutes = Router();

// Validation schemas
const packageSchema = z.object({
  provider_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  service_type: z.enum(['photography', 'editing', 'both']),
  duration_hours: z.number().positive(),
  price: z.number().positive(),
  deliverables: z.array(z.string()).optional(),
  max_revisions: z.number().int().min(0).optional(),
  turnaround_days: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
});

const portfolioItemSchema = z.object({
  provider_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  image_url: z.string().url().optional(),
  category: z.string().optional(),
  is_featured: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
});

const uploadSchema = z.object({
  providerId: z.string().uuid(),
  fileName: z.string().min(1),
  contentType: z.string().optional(),
  base64Data: z.string().min(1),
});

const paymentSchema = z.object({
  booking_id: z.string().uuid(),
  amount: z.number().positive(),
  payment_type: z.enum(['deposit', 'full_payment', 'refund']),
  payment_method: z.enum(['onepay', 'helapay', 'bank_transfer', 'card']),
});

const reviewSchema = z.object({
  booking_id: z.string().uuid(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
  would_recommend: z.boolean().optional(),
  professionalism_rating: z.number().min(1).max(5).optional(),
  quality_rating: z.number().min(1).max(5).optional(),
  value_rating: z.number().min(1).max(5).optional(),
});

const messageSchema = z.object({
  booking_id: z.string().uuid(),
  recipient_id: z.string().uuid(),
  message: z.string().min(1),
});

const notificationSchema = z.object({
  user_id: z.string().uuid(),
  type: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  data: z.record(z.any()).optional(),
});

const scheduleSchema = z.object({
  provider_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
  is_active: z.boolean().optional(),
});

const blockedDateSchema = z.object({
  provider_id: z.string().uuid(),
  blocked_date: z.string(),
  reason: z.string().optional(),
});

// Helper to wrap controller methods with error handling
const wrap = (fn: (req: any, res: any) => Promise<void>) => {
  return (req: any, res: any) => {
    ctrl.handle(fn, req, res);
  };
};

// ==================== Packages ====================
marketplaceRoutes.get('/packages/provider/:providerId', wrap(ctrl.getProviderPackages));
marketplaceRoutes.post('/packages', authenticate, validateRequest(packageSchema), wrap(ctrl.createPackage));
marketplaceRoutes.put('/packages/:id', authenticate, validateRequest(packageSchema.partial()), wrap(ctrl.updatePackage));
marketplaceRoutes.delete('/packages/:id', authenticate, wrap(ctrl.deletePackage));

// ==================== Portfolio ====================
marketplaceRoutes.get('/portfolio/provider/:providerId', wrap(ctrl.getProviderPortfolio));
marketplaceRoutes.post('/portfolio', authenticate, validateRequest(portfolioItemSchema), wrap(ctrl.createPortfolioItem));
marketplaceRoutes.put('/portfolio/:id', authenticate, validateRequest(portfolioItemSchema.partial()), wrap(ctrl.updatePortfolioItem));
marketplaceRoutes.delete('/portfolio/:id', authenticate, wrap(ctrl.deletePortfolioItem));
marketplaceRoutes.post('/portfolio/upload', authenticate, validateRequest(uploadSchema), wrap(ctrl.uploadImage));

// ==================== Payments ====================
marketplaceRoutes.get('/payments/me', authenticate, wrap(ctrl.getUserPayments));
marketplaceRoutes.post('/payments', authenticate, validateRequest(paymentSchema), wrap(ctrl.createPayment));

// ==================== Reviews ====================
marketplaceRoutes.get('/reviews/me', authenticate, wrap(ctrl.getMyReviews));
marketplaceRoutes.get('/reviews/provider/:providerId', wrap(ctrl.getProviderReviews));
marketplaceRoutes.get('/reviews/pending', authenticate, wrap(ctrl.getPendingReviews));
marketplaceRoutes.post('/reviews', authenticate, validateRequest(reviewSchema), wrap(ctrl.createReview));

// ==================== Messages ====================
marketplaceRoutes.post('/messages', authenticate, validateRequest(messageSchema), wrap(ctrl.sendMessage));
marketplaceRoutes.get('/messages/conversations', authenticate, wrap(ctrl.getConversations));
marketplaceRoutes.get('/messages/booking/:bookingId', authenticate, wrap(ctrl.getBookingMessages));
marketplaceRoutes.get('/messages/unread-count', authenticate, wrap(ctrl.getUnreadMessageCount));
marketplaceRoutes.put('/messages/:id/read', authenticate, wrap(ctrl.markMessageRead));
marketplaceRoutes.put('/messages/booking/:bookingId/read', authenticate, wrap(ctrl.markBookingMessagesRead));
marketplaceRoutes.delete('/messages/:id', authenticate, wrap(ctrl.deleteMessage));

// ==================== Notifications ====================
marketplaceRoutes.post('/notifications', authenticate, validateRequest(notificationSchema), wrap(ctrl.createNotification));
marketplaceRoutes.get('/notifications', authenticate, wrap(ctrl.getNotifications));
marketplaceRoutes.get('/notifications/unread', authenticate, wrap(ctrl.getUnreadNotifications));
marketplaceRoutes.get('/notifications/unread-count', authenticate, wrap(ctrl.getUnreadNotificationCount));
marketplaceRoutes.put('/notifications/:id/read', authenticate, wrap(ctrl.markNotificationRead));
marketplaceRoutes.put('/notifications/read-all', authenticate, wrap(ctrl.markAllNotificationsRead));
marketplaceRoutes.delete('/notifications/:id', authenticate, wrap(ctrl.deleteNotification));
marketplaceRoutes.delete('/notifications', authenticate, wrap(ctrl.deleteAllNotifications));

// ==================== Availability ====================
marketplaceRoutes.get('/availability/provider/:providerId/schedules', wrap(ctrl.getProviderSchedules));
marketplaceRoutes.put('/availability/provider/:providerId/schedules', authenticate, wrap(ctrl.updateProviderSchedules));
marketplaceRoutes.put('/availability/schedules/:id', authenticate, validateRequest(scheduleSchema.partial()), wrap(ctrl.updateSchedule));
marketplaceRoutes.get('/availability/provider/:providerId/blocked-dates', wrap(ctrl.getProviderBlockedDates));
marketplaceRoutes.post('/availability/blocked-dates', authenticate, validateRequest(blockedDateSchema), wrap(ctrl.createBlockedDate));
marketplaceRoutes.delete('/availability/blocked-dates/:id', authenticate, wrap(ctrl.deleteBlockedDate));

// ==================== Public ====================
marketplaceRoutes.get('/public/providers/:providerId/details', wrap(ctrl.getPublicProviderDetails));
marketplaceRoutes.get('/public/portfolios', wrap(ctrl.getPublicPortfolios));

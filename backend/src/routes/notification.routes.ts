import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

export const notificationRoutes = Router();

notificationRoutes.post('/', authenticate, (req, res) => notificationController.createNotification(req as any, res));
notificationRoutes.get('/', authenticate, (req, res) => notificationController.getUserNotifications(req as any, res));
notificationRoutes.get('/unread', authenticate, (req, res) => notificationController.getUnreadNotifications(req as any, res));
notificationRoutes.get('/unread-count', authenticate, (req, res) => notificationController.getUnreadCount(req as any, res));
notificationRoutes.put('/:notificationId/read', authenticate, (req, res) => notificationController.markAsRead(req as any, res));
notificationRoutes.put('/read-all', authenticate, (req, res) => notificationController.markAllAsRead(req as any, res));
notificationRoutes.delete('/:notificationId', authenticate, (req, res) => notificationController.deleteNotification(req as any, res));
notificationRoutes.delete('/', authenticate, (req, res) => notificationController.deleteAllNotifications(req as any, res));

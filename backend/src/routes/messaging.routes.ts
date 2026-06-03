import { Router } from 'express';
import { messagingController } from '../controllers/messaging.controller';
import { authenticate } from '../middleware/auth.middleware';

export const messagingRoutes = Router();

messagingRoutes.post('/', authenticate, (req, res) => messagingController.sendMessage(req as any, res));
messagingRoutes.get('/booking/:bookingId', authenticate, (req, res) => messagingController.getBookingMessages(req as any, res));
messagingRoutes.get('/conversations', authenticate, (req, res) => messagingController.getConversations(req as any, res));
messagingRoutes.get('/unread-count', authenticate, (req, res) => messagingController.getUnreadCount(req as any, res));
messagingRoutes.put('/:messageId/read', authenticate, (req, res) => messagingController.markAsRead(req as any, res));
messagingRoutes.put('/booking/:bookingId/read', authenticate, (req, res) => messagingController.markBookingAsRead(req as any, res));
messagingRoutes.delete('/:messageId', authenticate, (req, res) => messagingController.deleteMessage(req as any, res));

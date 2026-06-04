import { Request, Response } from 'express';
import { messagingService } from '../services/messaging.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class MessagingController {
  async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const { booking_id, recipient_id, message } = req.body;
      const msg = await messagingService.sendMessage({
        booking_id,
        sender_id: req.userId,
        recipient_id,
        message,
      });
      res.status(201).json({ success: true, data: msg, message: 'Message sent' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getBookingMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const { bookingId } = req.params;
      const messages = await messagingService.getBookingMessages(bookingId, req.userId);
      res.status(200).json({ success: true, data: messages });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getConversations(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const conversations = await messagingService.getConversations(req.userId);
      res.status(200).json({ success: true, data: conversations });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const count = await messagingService.getUnreadCount(req.userId);
      res.status(200).json({ success: true, data: count });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const message = await messagingService.markAsRead(messageId);
      res.status(200).json({ success: true, data: message, message: 'Marked as read' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async markBookingAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const { bookingId } = req.params;
      await messagingService.markBookingAsRead(bookingId, req.userId);
      res.status(200).json({ success: true, message: 'Messages marked as read' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async deleteMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      await messagingService.deleteMessage(messageId);
      res.status(200).json({ success: true, message: 'Message deleted' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }
}

export const messagingController = new MessagingController();

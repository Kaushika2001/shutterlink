import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class NotificationController {
  async createNotification(req: AuthRequest, res: Response): Promise<void> {
    try {
      const notification = await notificationService.createNotification(req.body);
      res.status(201).json({ success: true, data: notification, message: 'Notification created' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getUserNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const limit = Number(req.query.limit) || 50;
      const offset = Number(req.query.offset) || 0;
      const notifications = await notificationService.getUserNotifications(req.userId, limit, offset);
      res.status(200).json({ success: true, data: notifications });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getUnreadNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const notifications = await notificationService.getUnreadNotifications(req.userId);
      res.status(200).json({ success: true, data: notifications });
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
      const count = await notificationService.getUnreadCount(req.userId);
      res.status(200).json({ success: true, data: count });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;
      const notification = await notificationService.markAsRead(notificationId);
      res.status(200).json({ success: true, data: notification, message: 'Marked as read' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      await notificationService.markAllAsRead(req.userId);
      res.status(200).json({ success: true, message: 'All marked as read' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async deleteNotification(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;
      await notificationService.deleteNotification(notificationId);
      res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async deleteAllNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      await notificationService.deleteAllNotifications(req.userId);
      res.status(200).json({ success: true, message: 'All notifications deleted' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }
}

export const notificationController = new NotificationController();

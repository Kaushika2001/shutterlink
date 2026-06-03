import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { marketplaceService } from '../services/marketplace.service';

export class MarketplaceController {
  async handle(fn: (req: any, res: Response) => Promise<void>, req: Request, res: Response) {
    try {
      await fn(req, res);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  }

  // ==================== Packages ====================
  async getProviderPackages(req: Request, res: Response) {
    const data = await marketplaceService.getProviderPackages(req.params.providerId);
    res.json({ success: true, data });
  }

  async searchAllPackages(req: Request, res: Response) {
    const data = await marketplaceService.searchAllPackages();
    res.json({ success: true, data });
  }

  async getPackageById(req: Request, res: Response) {
    const data = await marketplaceService.getPackageById(req.params.id);
    res.json({ success: true, data });
  }

  async createPackage(req: Request, res: Response) {
    const data = await marketplaceService.createPackage(req.body);
    res.status(201).json({ success: true, data });
  }

  async updatePackage(req: Request, res: Response) {
    const data = await marketplaceService.updatePackage(req.params.id, req.body);
    res.json({ success: true, data });
  }

  async deletePackage(req: Request, res: Response) {
    await marketplaceService.deletePackage(req.params.id);
    res.json({ success: true, data: true });
  }

  // ==================== Portfolio ====================
  async getProviderPortfolio(req: Request, res: Response) {
    const data = await marketplaceService.getProviderPortfolio(req.params.providerId);
    res.json({ success: true, data });
  }

  async createPortfolioItem(req: AuthRequest, res: Response) {
    const data = await marketplaceService.createPortfolioItem(req.userId!, req.body);
    res.status(201).json({ success: true, data });
  }

  // ==================== Payments ====================
  async getUserPayments(req: AuthRequest, res: Response) {
    const data = await marketplaceService.getUserPayments(req.userId!);
    res.json({ success: true, data });
  }

  async createPayment(req: AuthRequest, res: Response) {
    const data = await marketplaceService.createPayment(req.userId!, req.body);
    res.status(201).json({ success: true, data });
  }

  // ==================== Reviews ====================
  async getMyReviews(req: AuthRequest, res: Response) {
    const data = await marketplaceService.getMyReviews(req.userId!);
    res.json({ success: true, data });
  }

  async getProviderReviews(req: Request, res: Response) {
    const data = await marketplaceService.getProviderReviews(req.params.providerId);
    res.json({ success: true, data });
  }

  async getPendingReviews(req: AuthRequest, res: Response) {
    const data = await marketplaceService.getPendingReviews(req.userId!);
    res.json({ success: true, data });
  }

  async createReview(req: AuthRequest, res: Response) {
    const data = await marketplaceService.createReview(req.userId!, req.body);
    res.status(201).json({ success: true, data });
  }

  // ==================== Messages ====================
  async sendMessage(req: AuthRequest, res: Response) {
    const data = await marketplaceService.sendMessage(req.userId!, req.body);
    res.status(201).json({ success: true, data });
  }

  async getBookingMessages(req: Request, res: Response) {
    const data = await marketplaceService.getBookingMessages(req.params.bookingId);
    res.json({ success: true, data });
  }

  async getConversations(req: AuthRequest, res: Response) {
    const data = await marketplaceService.getConversations(req.userId!);
    res.json({ success: true, data });
  }

  async getUnreadMessageCount(req: AuthRequest, res: Response) {
    const data = await marketplaceService.getUnreadMessageCount(req.userId!);
    res.json({ success: true, data });
  }

  async markMessageRead(req: Request, res: Response) {
    const data = await marketplaceService.markMessageRead(req.params.id);
    res.json({ success: true, data });
  }

  async markBookingMessagesRead(req: AuthRequest, res: Response) {
    await marketplaceService.markBookingMessagesRead(req.params.bookingId, req.userId!);
    res.json({ success: true, data: true });
  }

  async deleteMessage(req: Request, res: Response) {
    await marketplaceService.deleteMessage(req.params.id);
    res.json({ success: true, data: true });
  }

  // ==================== Notifications ====================
  async createNotification(req: Request, res: Response) {
    const data = await marketplaceService.createNotification(req.body);
    res.status(201).json({ success: true, data });
  }

  async getNotifications(req: AuthRequest, res: Response) {
    const limit = Number(req.query.limit || 50);
    const offset = Number(req.query.offset || 0);
    const data = await marketplaceService.getNotifications(req.userId!, limit, offset);
    res.json({ success: true, data });
  }

  async getUnreadNotifications(req: AuthRequest, res: Response) {
    const data = await marketplaceService.getUnreadNotifications(req.userId!);
    res.json({ success: true, data });
  }

  async getUnreadNotificationCount(req: AuthRequest, res: Response) {
    const data = await marketplaceService.getUnreadNotificationCount(req.userId!);
    res.json({ success: true, data });
  }

  async markNotificationRead(req: Request, res: Response) {
    const data = await marketplaceService.markNotificationRead(req.params.id);
    res.json({ success: true, data });
  }

  async markAllNotificationsRead(req: AuthRequest, res: Response) {
    await marketplaceService.markAllNotificationsRead(req.userId!);
    res.json({ success: true, data: true });
  }

  async deleteNotification(req: Request, res: Response) {
    await marketplaceService.deleteNotification(req.params.id);
    res.json({ success: true, data: true });
  }

  async deleteAllNotifications(req: AuthRequest, res: Response) {
    await marketplaceService.deleteAllNotifications(req.userId!);
    res.json({ success: true, data: true });
  }

  // ==================== Availability ====================
  async getProviderSchedules(req: Request, res: Response) {
    const data = await marketplaceService.getProviderSchedules(req.params.providerId);
    res.json({ success: true, data });
  }

  async updateProviderSchedules(req: Request, res: Response) {
    const schedules = req.body?.schedules || [];
    const data = await marketplaceService.updateProviderSchedules(req.params.providerId, schedules);
    res.json({ success: true, data });
  }

  async updateSchedule(req: Request, res: Response) {
    const data = await marketplaceService.updateSchedule(req.params.id, req.body);
    res.json({ success: true, data });
  }

  async getProviderBlockedDates(req: Request, res: Response) {
    const data = await marketplaceService.getProviderBlockedDates(req.params.providerId);
    res.json({ success: true, data });
  }

  async createBlockedDate(req: Request, res: Response) {
    const data = await marketplaceService.createBlockedDate(req.body);
    res.status(201).json({ success: true, data });
  }

  async deleteBlockedDate(req: Request, res: Response) {
    await marketplaceService.deleteBlockedDate(req.params.id);
    res.json({ success: true, data: true });
  }

  // ==================== Public ====================
  async getPublicProviderDetails(req: Request, res: Response) {
    const data = await marketplaceService.getPublicProviderDetails(req.params.providerId);
    res.json({ success: true, data });
  }

  async getPublicPortfolios(req: Request, res: Response) {
    const data = await marketplaceService.getPublicPortfolios();
    res.json({ success: true, data });
  }

  async getPublicPortfolioAlbums(req: Request, res: Response) {
    const data = await marketplaceService.getPublicPortfolioAlbums();
    res.json({ success: true, data });
  }
}

export const marketplaceController = new MarketplaceController();

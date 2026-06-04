import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class AdminController {
  async getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await adminService.getDashboardStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getRecentBookings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const limit = Number(req.query.limit) || 10;
      const bookings = await adminService.getRecentBookings(limit);
      res.status(200).json({ success: true, data: bookings });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const users = await adminService.getUsers();
      res.status(200).json({ success: true, data: users });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getProviders(req: AuthRequest, res: Response): Promise<void> {
    try {
      const providers = await adminService.getProviders();
      res.status(200).json({ success: true, data: providers });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getBookings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const bookings = await adminService.getBookings();
      res.status(200).json({ success: true, data: bookings });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getPayments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const payments = await adminService.getPayments();
      res.status(200).json({ success: true, data: payments });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async updateUserStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      const user = await adminService.updateUserStatus(userId, isActive);
      res.status(200).json({ success: true, data: user, message: 'User status updated' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async verifyProvider(req: AuthRequest, res: Response): Promise<void> {
    try {
      await adminService.verifyProvider(req.params.providerId, req.userId!);
      res.status(200).json({ success: true, message: 'Provider verified' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async revokeProvider(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await adminService.revokeProviderVerification(req.params.providerId, req.userId!);
      res.status(200).json({ success: true, data, message: 'Provider verification revoked' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getDisputes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { disputeService } = await import('../services/dispute.service');
      const data = await disputeService.getDisputes(req.query.status as string | undefined);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async updateDispute(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { disputeService } = await import('../services/dispute.service');
      const { status, resolution_notes } = req.body;
      const data = await disputeService.updateDisputeStatus(
        req.params.disputeId,
        status,
        resolution_notes,
        req.userId
      );
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }
}

export const adminController = new AdminController();

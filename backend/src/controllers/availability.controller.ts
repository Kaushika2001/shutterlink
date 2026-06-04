import { Request, Response } from 'express';
import { availabilityService } from '../services/availability.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class AvailabilityController {
  async getMySchedules(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const schedules = await availabilityService.getSchedules(req.userId);
      res.status(200).json({ success: true, data: schedules });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async setMySchedules(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const schedules = await availabilityService.setSchedules(req.userId, req.body.schedules || []);
      res.status(200).json({ success: true, data: schedules, message: 'Schedules updated' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getSchedules(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.params;
      const schedules = await availabilityService.getSchedules(providerId);
      res.status(200).json({ success: true, data: schedules });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async setSchedules(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const { providerId } = req.params;
      await availabilityService.assertProviderOwnership(providerId, req.userId);
      const schedules = await availabilityService.setSchedules(providerId, req.body.schedules || []);
      res.status(200).json({ success: true, data: schedules, message: 'Schedules updated' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async updateSchedule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const schedule = await availabilityService.updateSchedule(scheduleId, req.body);
      res.status(200).json({ success: true, data: schedule, message: 'Schedule updated' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getBlockedDates(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.params;
      const dates = await availabilityService.getBlockedDates(providerId);
      res.status(200).json({ success: true, data: dates });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async blockDate(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const { provider_id, blocked_date, reason } = req.body;
      await availabilityService.assertProviderOwnership(provider_id, req.userId);
      const blocked = await availabilityService.blockDate(provider_id, { blocked_date, reason });
      res.status(201).json({ success: true, data: blocked, message: 'Date blocked' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async unblockDate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { blockedDateId } = req.params;
      await availabilityService.unblockDate(blockedDateId);
      res.status(200).json({ success: true, message: 'Date unblocked' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }
}

export const availabilityController = new AvailabilityController();

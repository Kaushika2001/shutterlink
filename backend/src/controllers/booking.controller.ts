import { Request, Response } from 'express';
import { bookingService } from '../services/booking.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { validateSchema } from '../utils/validation';
import { CreateBookingPayload } from '../types';
import { z } from 'zod';

export class BookingController {
  async createBooking(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const schema = z.object({
        provider_id: z.string().uuid(),
        package_id: z.string().uuid(),
        service_date: z.string(),
        service_time: z.string(),
        duration_hours: z.number().positive(),
        location_type: z.enum(['on_site', 'studio', 'remote']),
        location_address: z.string(),
        special_requests: z.string().optional(),
      });

      const payload = validateSchema<CreateBookingPayload>(schema, req.body);
      const booking = await bookingService.createBooking(req.userId, payload);

      res.status(201).json({
        success: true,
        data: booking,
        message: 'Booking created',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getCustomerBookings(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { page, limit } = req.query;
      const bookings = await bookingService.getCustomerBookings(
        req.userId,
        page ? Number(page) : 1,
        limit ? Number(limit) : 20
      );

      res.status(200).json({ success: true, data: bookings });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getProviderBookings(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { page, limit } = req.query;
      const bookings = await bookingService.getProviderBookings(
        req.userId,
        page ? Number(page) : 1,
        limit ? Number(limit) : 20
      );

      res.status(200).json({ success: true, data: bookings });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getUpcomingBookings(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { isProvider } = req.query;
      const bookings = await bookingService.getUpcomingBookings(req.userId, isProvider === 'true');

      res.status(200).json({ success: true, data: bookings });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getBookingHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { isProvider } = req.query;
      const bookings = await bookingService.getBookingHistory(req.userId, isProvider === 'true');

      res.status(200).json({ success: true, data: bookings });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getBookingById(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const booking = await bookingService.getBookingById(bookingId);

      res.status(200).json({ success: true, data: booking });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async confirmBooking(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { bookingId } = req.params;
      const booking = await bookingService.confirmBooking(bookingId, req.userId);

      res.status(200).json({ success: true, data: booking, message: 'Booking confirmed' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async completeBooking(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { bookingId } = req.params;
      const booking = await bookingService.completeBooking(bookingId, req.userId);

      res.status(200).json({ success: true, data: booking, message: 'Booking completed' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async cancelBooking(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { bookingId } = req.params;
      const { reason } = validateSchema<{ reason: string }>(z.object({ reason: z.string() }), req.body);

      const booking = await bookingService.cancelBooking(bookingId, reason, req.userId);

      res.status(200).json({ success: true, data: booking, message: 'Booking cancelled' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async rejectBooking(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { bookingId } = req.params;
      const booking = await bookingService.rejectBooking(bookingId, req.userId);

      res.status(200).json({ success: true, data: booking, message: 'Booking rejected' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async checkAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { providerId, date, startTime, durationHours } = req.query;

      if (!providerId || !date || !startTime || !durationHours) {
        res.status(400).json({ success: false, error: 'Missing required parameters' });
        return;
      }

      const available = await bookingService.checkAvailability(
        providerId as string,
        date as string,
        startTime as string,
        Number(durationHours)
      );

      res.status(200).json({ success: true, data: { available } });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { isProvider } = req.query;
      const stats = await bookingService.getBookingStats(req.userId, isProvider === 'true');

      res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }
}

export const bookingController = new BookingController();

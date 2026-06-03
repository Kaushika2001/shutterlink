import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

export const bookingRoutes = Router();

bookingRoutes.post('/', authenticate, authorize('customer', 'provider'), (req, res) => bookingController.createBooking(req as any, res));
bookingRoutes.get('/customer', authenticate, authorize('customer', 'provider'), (req, res) =>
  bookingController.getCustomerBookings(req as any, res)
);
bookingRoutes.get('/provider', authenticate, authorize('provider'), (req, res) =>
  bookingController.getProviderBookings(req as any, res)
);
bookingRoutes.get('/upcoming', authenticate, (req, res) => bookingController.getUpcomingBookings(req as any, res));
bookingRoutes.get('/history', authenticate, (req, res) => bookingController.getBookingHistory(req as any, res));
bookingRoutes.get('/availability', (req, res) => bookingController.checkAvailability(req, res));
bookingRoutes.get('/stats', authenticate, (req, res) => bookingController.getStats(req as any, res));
bookingRoutes.get('/:bookingId', authenticate, (req, res) => bookingController.getBookingById(req, res));
bookingRoutes.put('/:bookingId/confirm', authenticate, authorize('provider'), (req, res) =>
  bookingController.confirmBooking(req as any, res)
);
bookingRoutes.put('/:bookingId/complete', authenticate, authorize('provider'), (req, res) =>
  bookingController.completeBooking(req as any, res)
);
bookingRoutes.put('/:bookingId/cancel', authenticate, (req, res) => bookingController.cancelBooking(req as any, res));
bookingRoutes.put('/:bookingId/reject', authenticate, authorize('provider'), (req, res) =>
  bookingController.rejectBooking(req as any, res)
);

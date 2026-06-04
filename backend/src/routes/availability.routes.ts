import { Router } from 'express';
import { availabilityController } from '../controllers/availability.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

export const availabilityRoutes = Router();

availabilityRoutes.get('/me/schedules', authenticate, authorize('provider'), (req, res) =>
  availabilityController.getMySchedules(req as any, res)
);
availabilityRoutes.put('/me/schedules', authenticate, authorize('provider'), (req, res) =>
  availabilityController.setMySchedules(req as any, res)
);
availabilityRoutes.get('/provider/:providerId/schedules', (req, res) => availabilityController.getSchedules(req, res));
availabilityRoutes.put('/provider/:providerId/schedules', authenticate, authorize('provider'), (req, res) =>
  availabilityController.setSchedules(req as any, res)
);
availabilityRoutes.put('/schedules/:scheduleId', authenticate, authorize('provider'), (req, res) =>
  availabilityController.updateSchedule(req as any, res)
);
availabilityRoutes.get('/provider/:providerId/blocked-dates', (req, res) => availabilityController.getBlockedDates(req, res));
availabilityRoutes.post('/blocked-dates', authenticate, authorize('provider'), (req, res) =>
  availabilityController.blockDate(req as any, res)
);
availabilityRoutes.delete('/blocked-dates/:blockedDateId', authenticate, authorize('provider'), (req, res) =>
  availabilityController.unblockDate(req as any, res)
);

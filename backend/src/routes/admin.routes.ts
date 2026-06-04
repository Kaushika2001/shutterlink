import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

export const adminRoutes = Router();

const adminAuth = [authenticate, authorize('admin')];

adminRoutes.get('/dashboard', ...adminAuth, (req, res) => adminController.getDashboardStats(req as any, res));
adminRoutes.get('/users', ...adminAuth, (req, res) => adminController.getUsers(req as any, res));
adminRoutes.get('/providers', ...adminAuth, (req, res) => adminController.getProviders(req as any, res));
adminRoutes.get('/bookings', ...adminAuth, (req, res) => adminController.getBookings(req as any, res));
adminRoutes.get('/payments', ...adminAuth, (req, res) => adminController.getPayments(req as any, res));
adminRoutes.get('/reports', ...adminAuth, (req, res) => adminController.getRecentBookings(req as any, res));
adminRoutes.put('/users/:userId/status', ...adminAuth, (req, res) => adminController.updateUserStatus(req as any, res));
adminRoutes.put('/providers/:providerId/verify', ...adminAuth, (req, res) => adminController.verifyProvider(req as any, res));
adminRoutes.put('/providers/:providerId/revoke', ...adminAuth, (req, res) => adminController.revokeProvider(req as any, res));
adminRoutes.get('/disputes', ...adminAuth, (req, res) => adminController.getDisputes(req as any, res));
adminRoutes.put('/disputes/:disputeId', ...adminAuth, (req, res) => adminController.updateDispute(req as any, res));

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

export const authRoutes = Router();

authRoutes.post('/register', (req, res) => authController.register(req, res));
authRoutes.post('/login', (req, res) => authController.login(req, res));
authRoutes.get('/current-user', authenticate, (req, res) => authController.getCurrentUser(req as any, res));
authRoutes.post('/refresh-session', authenticate, (req, res) => authController.refreshSession(req as any, res));
authRoutes.get('/user/:userId', (req, res) => authController.getUserById(req, res));
authRoutes.post('/logout', authenticate, (req, res) => authController.logout(req as any, res));
authRoutes.post('/request-password-reset', (req, res) => authController.requestPasswordReset(req, res));
authRoutes.post('/reset-password', (req, res) => authController.resetPassword(req, res));

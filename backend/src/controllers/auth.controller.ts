import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { RegisterPayload, LoginPayload } from '../types';
import { validateSchema, emailSchema, passwordSchema } from '../utils/validation';
import { z } from 'zod';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const registerSchema = z.object({
        email: emailSchema,
        password: passwordSchema,
        name: z.string().min(2),
        role: z.enum(['customer', 'provider', 'admin']),
        phone: z.string().optional(),
      });

      const payload = validateSchema<RegisterPayload>(registerSchema, req.body);
      const result = await authService.register(payload);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Registration successful',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginSchema = z.object({
        email: emailSchema,
        password: z.string(),
      });

      const payload = validateSchema<LoginPayload>(loginSchema, req.body);
      const result = await authService.login(payload);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const user = await authService.getCurrentUser(req.userId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({ success: false, error: 'User ID is required' });
        return;
      }

      const user = await authService.getUserById(userId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      await authService.logout(req.userId);

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = validateSchema<{ email: string }>(z.object({ email: emailSchema }), req.body);

      await authService.requestPasswordReset(email);

      res.status(200).json({
        success: true,
        message: 'Password reset email sent',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = validateSchema<{ token: string; newPassword: string }>(
        z.object({
          token: z.string(),
          newPassword: passwordSchema,
        }),
        req.body
      );

      await authService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export const authController = new AuthController();

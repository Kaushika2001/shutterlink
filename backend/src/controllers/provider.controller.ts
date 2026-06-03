import { Request, Response } from 'express';
import { providerService } from '../services/provider.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { validateSchema } from '../utils/validation';
import { CreateProviderPayload } from '../types';
import { z } from 'zod';

export class ProviderController {
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const profile = await providerService.getProviderProfile(req.userId);
      res.status(200).json({ success: true, data: profile });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.params;
      const provider = await providerService.getProviderById(providerId);
      res.status(200).json({ success: true, data: provider });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async createOrUpdate(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const schema = z.object({
        business_name: z.string().min(2),
        service_type: z.array(z.enum(['photographer', 'editor', 'equipment_renter'])),
        specializations: z.array(z.string()).optional(),
        years_experience: z.number().min(0),
        hourly_rate: z.number().positive(),
        bio: z.string().optional(),
        equipment_list: z.array(z.string()).optional(),
        coverage_areas: z.array(z.string()).optional(),
        max_travel_distance: z.number().optional(),
        social_urls: z.record(z.string()).optional(),
      });

      const payload = validateSchema<CreateProviderPayload>(schema, req.body);
      const { provider, token } = await providerService.createOrUpdateProvider(req.userId, payload);

      res.status(200).json({
        success: true,
        data: provider,
        token,
        message: 'Provider profile saved',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async search(req: Request, res: Response): Promise<void> {
    try {
      const { service_type, min_rating, min_price, max_price, specialization, location, is_verified, page, limit } = req.query;

      const providers = await providerService.searchProviders({
        service_type: service_type as any,
        min_rating: min_rating ? Number(min_rating) : undefined,
        min_price: min_price ? Number(min_price) : undefined,
        max_price: max_price ? Number(max_price) : undefined,
        specialization: specialization as string,
        location: location as string,
        is_verified: is_verified ? is_verified === 'true' : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      res.status(200).json({ success: true, data: providers });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getFeatured(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;
      const providers = await providerService.getFeaturedProviders(limit ? Number(limit) : 6);
      res.status(200).json({ success: true, data: providers });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async saveProvider(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { providerId } = req.body;
      await providerService.saveProvider(req.userId, providerId);

      res.status(200).json({ success: true, message: 'Provider saved' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async unsaveProvider(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { providerId } = req.body;
      await providerService.unsaveProvider(req.userId, providerId);

      res.status(200).json({ success: true, message: 'Provider unsaved' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async getSavedProviders(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const providers = await providerService.getSavedProviders(req.userId);
      res.status(200).json({ success: true, data: providers });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async checkIfSaved(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { providerId } = req.params;
      const isSaved = await providerService.isProviderSaved(req.userId, providerId);

      res.status(200).json({ success: true, data: { isSaved } });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async updateAvailability(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { status } = validateSchema<{ status: 'available' | 'busy' | 'unavailable' }>(
        z.object({ status: z.enum(['available', 'busy', 'unavailable']) }),
        req.body
      );

      const provider = await providerService.getProviderProfile(req.userId);
      await providerService.updateAvailability(provider.id, status);

      res.status(200).json({ success: true, message: 'Availability updated' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }
}

export const providerController = new ProviderController();

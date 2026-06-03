import { Response } from 'express';
import { portfolioService } from '../services/portfolio.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class PortfolioController {
  async updatePortfolioItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const { itemId } = req.params;
      const item = await portfolioService.updatePortfolioItem(req.userId, itemId, req.body);
      res.status(200).json({ success: true, data: item, message: 'Portfolio updated' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async deletePortfolioItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const { itemId } = req.params;
      await portfolioService.deletePortfolioItem(req.userId, itemId);
      res.status(200).json({ success: true, message: 'Portfolio item deleted' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async uploadPortfolioImage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const body = req.body as {
        providerId?: string;
        provider_id?: string;
        fileName?: string;
        contentType?: string;
        base64Data?: string;
      };

      const providerId = body.providerId || body.provider_id;
      const { fileName, contentType, base64Data } = body;

      if (!providerId || !fileName || !base64Data) {
        res.status(400).json({
          success: false,
          error: 'providerId, fileName, and base64Data are required',
        });
        return;
      }

      const result = await portfolioService.uploadImageFile(
        req.userId,
        providerId,
        fileName,
        contentType,
        base64Data
      );

      res.status(201).json({ success: true, data: result, message: 'Image uploaded' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }
}

export const portfolioController = new PortfolioController();

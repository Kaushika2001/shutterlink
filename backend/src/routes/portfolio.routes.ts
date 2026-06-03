import { Router } from 'express';
import { portfolioController } from '../controllers/portfolio.controller';
import { authenticate } from '../middleware/auth.middleware';

export const portfolioRoutes = Router();

portfolioRoutes.put('/:itemId', authenticate, (req, res) => portfolioController.updatePortfolioItem(req as any, res));
portfolioRoutes.delete('/:itemId', authenticate, (req, res) => portfolioController.deletePortfolioItem(req as any, res));
portfolioRoutes.post('/upload', authenticate, (req, res) => portfolioController.uploadPortfolioImage(req as any, res));

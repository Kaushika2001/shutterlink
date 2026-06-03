import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { marketplaceController as ctrl } from '../controllers/marketplace.controller';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

export const marketplaceRoutes = Router();

// Validation schemas
const packageSchema = z.object({
  provider_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  service_type: z.enum(['photography', 'editing', 'both']),
  duration_hours: z.number().positive(),
  price: z.number().positive(),
  deliverables: z.array(z.string()).optional(),
  max_revisions: z.number().int().min(0).optional(),
  turnaround_days: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
});

const portfolioItemSchema = z.object({
  provider_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  image_url: z.string().url(),
  category: z.string().optional(),
  is_featured: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
});

// Helper to wrap controller methods with error handling
const wrap = (fn: (req: any, res: any) => Promise<void>) => {
  return (req: any, res: any) => {
    ctrl.handle(fn, req, res);
  };
};

// ==================== Packages ====================
marketplaceRoutes.get('/packages/provider/:providerId', wrap(ctrl.getProviderPackages));
marketplaceRoutes.get('/packages/search', wrap(ctrl.searchAllPackages));
marketplaceRoutes.get('/packages/:id', wrap(ctrl.getPackageById));
marketplaceRoutes.post('/packages', authenticate, validateRequest(packageSchema), wrap(ctrl.createPackage));
marketplaceRoutes.put('/packages/:id', authenticate, validateRequest(packageSchema.partial()), wrap(ctrl.updatePackage));
marketplaceRoutes.delete('/packages/:id', authenticate, wrap(ctrl.deletePackage));

// ==================== Portfolio ====================
marketplaceRoutes.get('/portfolio/provider/:providerId', wrap(ctrl.getProviderPortfolio));
marketplaceRoutes.post('/portfolio', authenticate, validateRequest(portfolioItemSchema), wrap(ctrl.createPortfolioItem));
// ==================== Public ====================
marketplaceRoutes.get('/public/providers/:providerId/details', wrap(ctrl.getPublicProviderDetails));
marketplaceRoutes.get('/public/portfolios', wrap(ctrl.getPublicPortfolios));
marketplaceRoutes.get('/public/portfolio-albums', wrap(ctrl.getPublicPortfolioAlbums));

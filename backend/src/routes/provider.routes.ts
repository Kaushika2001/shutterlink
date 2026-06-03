import { Router } from 'express';
import { providerController } from '../controllers/provider.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

export const providerRoutes = Router();

// Public routes
providerRoutes.get('/search', (req, res) => providerController.search(req, res));
providerRoutes.get('/featured', (req, res) => providerController.getFeatured(req, res));
providerRoutes.get('/by-id/:providerId', (req, res) => providerController.getById(req, res));

// Protected routes
providerRoutes.get('/profile', authenticate, (req, res) => providerController.getProfile(req as any, res));
providerRoutes.post('/create-or-update', authenticate, (req, res) =>
  providerController.createOrUpdate(req as any, res)
);
providerRoutes.put('/availability', authenticate, authorize('provider'), (req, res) =>
  providerController.updateAvailability(req as any, res)
);

// Save/Unsave
providerRoutes.post('/save', authenticate, authorize('customer'), (req, res) =>
  providerController.saveProvider(req as any, res)
);
providerRoutes.post('/unsave', authenticate, authorize('customer'), (req, res) =>
  providerController.unsaveProvider(req as any, res)
);
providerRoutes.get('/saved', authenticate, authorize('customer'), (req, res) =>
  providerController.getSavedProviders(req as any, res)
);
providerRoutes.get('/is-saved/:providerId', authenticate, authorize('customer'), (req, res) =>
  providerController.checkIfSaved(req as any, res)
);

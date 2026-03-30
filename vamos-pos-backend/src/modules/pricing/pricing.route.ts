import { Router } from 'express';
import { PricingController } from './pricing.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

// Pricing Rules
router.post('/rules', authenticate, authorizeRoles('ADMIN', 'OWNER'), PricingController.createPricingRule);
router.get('/rules', authenticate, PricingController.getPricingRules);
router.put('/rules/:id', authenticate, authorizeRoles('ADMIN', 'OWNER'), PricingController.updatePricingRule);
router.delete('/rules/:id', authenticate, authorizeRoles('ADMIN', 'OWNER'), PricingController.deletePricingRule);

// Packages
router.post('/packages', authenticate, authorizeRoles('ADMIN', 'OWNER'), PricingController.createPackage);
router.get('/packages', authenticate, PricingController.getPackages);
router.put('/packages/:id', authenticate, authorizeRoles('ADMIN', 'OWNER'), PricingController.updatePackage);
router.delete('/packages/:id', authenticate, authorizeRoles('ADMIN', 'OWNER'), PricingController.deletePackage);

// Estimate
router.get('/estimate', authenticate, PricingController.estimate);

export default router;

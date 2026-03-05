import { Router } from 'express';
import { PricingController } from './pricing.controller';

const router = Router();

// Pricing Rules
router.post('/rules', PricingController.createPricingRule);
router.get('/rules', PricingController.getPricingRules);
router.put('/rules/:id', PricingController.updatePricingRule);
router.delete('/rules/:id', PricingController.deletePricingRule);

// Packages
router.post('/packages', PricingController.createPackage);
router.get('/packages', PricingController.getPackages);
router.put('/packages/:id', PricingController.updatePackage);
router.delete('/packages/:id', PricingController.deletePackage);

// Estimate
router.get('/estimate', PricingController.estimate);

export default router;

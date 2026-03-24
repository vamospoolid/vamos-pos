import { Router } from 'express';
import { LicenseController } from './license.controller';

const router = Router();
const licenseController = new LicenseController();

router.get('/status', licenseController.getStatus);
router.post('/activate', licenseController.activate);
router.post('/demo', licenseController.requestDemo);

export default router;

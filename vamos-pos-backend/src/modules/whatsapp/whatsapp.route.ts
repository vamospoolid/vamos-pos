import { Router } from 'express';
import { getStatus, getQr, reset, sendTest, getTemplates, updateTemplate, resetTemplate } from './whatsapp.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

// Public / internal
router.get('/status', getStatus);
router.get('/qr', getQr);
router.post('/reset', reset);
router.post('/send-test', sendTest);

// WA Template management — admin only
router.get('/templates', authenticate, authorizeRoles('ADMIN', 'OWNER'), getTemplates);
router.put('/templates/:id', authenticate, authorizeRoles('ADMIN', 'OWNER'), updateTemplate);
router.post('/templates/:id/reset', authenticate, authorizeRoles('ADMIN', 'OWNER'), resetTemplate);

export default router;

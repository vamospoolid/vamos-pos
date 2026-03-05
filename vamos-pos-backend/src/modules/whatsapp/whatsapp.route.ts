import { Router } from 'express';
import { getStatus, getQr, reset, getTemplates, updateTemplate, resetTemplate } from './whatsapp.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

// Public (internal)
router.get('/status', getStatus);
router.get('/qr', getQr);
router.post('/reset', reset);

// WA Template management — admin only
router.get('/templates', authenticate, authorizeRoles('ADMIN', 'OWNER'), getTemplates);
router.put('/templates/:id', authenticate, authorizeRoles('ADMIN', 'OWNER'), updateTemplate);
router.post('/templates/:id/reset', authenticate, authorizeRoles('ADMIN', 'OWNER'), resetTemplate);

export default router;

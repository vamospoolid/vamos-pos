import { Router } from 'express';
import { AnnouncementController } from './announcement.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/active', AnnouncementController.getActive);
router.get('/', authenticate, AnnouncementController.getAll);
router.post('/', authenticate, AnnouncementController.create);
router.put('/:id', authenticate, AnnouncementController.update);
router.delete('/:id', authenticate, AnnouncementController.delete);

export default router;

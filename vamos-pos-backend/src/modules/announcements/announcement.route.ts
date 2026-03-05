import { Router } from 'express';
import { AnnouncementController } from './announcement.controller';

const router = Router();

router.get('/active', AnnouncementController.getActive);
router.get('/', AnnouncementController.getAll);
router.post('/', AnnouncementController.create);
router.put('/:id', AnnouncementController.update);
router.delete('/:id', AnnouncementController.delete);

export default router;

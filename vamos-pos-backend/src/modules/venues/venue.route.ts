import { Router } from 'express';
import { VenueController } from './venue.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.post('/', authenticate, authorizeRoles('ADMIN', 'OWNER'), VenueController.createVenue);
router.get('/', authenticate, VenueController.getVenues);
router.get('/:id', authenticate, VenueController.getVenueById);
router.put('/:id', authenticate, authorizeRoles('ADMIN', 'OWNER'), VenueController.updateVenue);
router.delete('/:id', authenticate, authorizeRoles('ADMIN', 'OWNER'), VenueController.deleteVenue);

export default router;

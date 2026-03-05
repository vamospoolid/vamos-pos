import { Router } from 'express';
import { VenueController } from './venue.controller';

const router = Router();

router.post('/', VenueController.createVenue);
router.get('/', VenueController.getVenues);
router.get('/:id', VenueController.getVenueById);
router.put('/:id', VenueController.updateVenue);
router.delete('/:id', VenueController.deleteVenue);

export default router;

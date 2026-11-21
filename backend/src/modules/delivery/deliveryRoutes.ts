import { Router } from 'express';
import { getDeliveries, retryDelivery } from './deliveryController';
import { authenticateJWT } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleCheck';

const router = Router();

router.use(authenticateJWT);

router.get('/', getDeliveries);
router.post('/:id/retry', requireRole('STATE_OFFICE', 'TRAINING_CENTRE', 'ADMIN'), retryDelivery);

export default router;


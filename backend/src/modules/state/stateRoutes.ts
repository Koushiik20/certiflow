import { Router } from 'express';
import { finalApproveBatch, cancelCertificate, getPlatformAnalytics } from './stateController';
import { authenticateJWT } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleCheck';

const router = Router();

router.use(authenticateJWT);

router.post('/batches/:id/final-approve', requireRole('STATE_OFFICE', 'ADMIN'), finalApproveBatch);
router.post('/certificates/:id/cancel', requireRole('STATE_OFFICE', 'ADMIN'), cancelCertificate);
router.get('/analytics', requireRole('STATE_OFFICE', 'ADMIN'), getPlatformAnalytics);

export default router;


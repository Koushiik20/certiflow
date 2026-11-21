import { Router } from 'express';
import { getPendingQualityBatches, flagCandidate, submitQualityReview } from './qualityController';
import { authenticateJWT } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleCheck';

const router = Router();

router.use(authenticateJWT);

router.get('/pending', requireRole('QUALITY_TEAM', 'STATE_OFFICE', 'ADMIN'), getPendingQualityBatches);
router.put('/batches/:batchId/candidates/:candidateId/flag', requireRole('QUALITY_TEAM', 'ADMIN'), flagCandidate);
router.post('/batches/:id/review', requireRole('QUALITY_TEAM', 'ADMIN'), submitQualityReview);

export default router;


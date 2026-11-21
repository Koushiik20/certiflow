import { Router } from 'express';
import { approveBatchDistrict, rejectBatchDistrict, getBatchApprovals } from './approvalController';
import { authenticateJWT } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleCheck';

const router = Router();

router.use(authenticateJWT);

router.post('/:id/approve', requireRole('DISTRICT_OFFICER', 'ADMIN'), approveBatchDistrict);
router.post('/:id/reject', requireRole('DISTRICT_OFFICER', 'ADMIN'), rejectBatchDistrict);
router.get('/:id/approvals', getBatchApprovals);

export default router;


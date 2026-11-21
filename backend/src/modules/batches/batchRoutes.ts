import { Router } from 'express';
import multer from 'multer';
import {
  createBatch,
  getBatches,
  getBatchById,
  uploadSpreadsheet,
  submitBatch,
  returnBatch,
  resubmitBatch,
  downloadExcelTemplate,
  downloadSampleFile
} from './batchController';
import { authenticateJWT } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleCheck';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

const router = Router();

router.use(authenticateJWT);

router.get('/template', downloadExcelTemplate);
router.get('/samples/:type', downloadSampleFile);
router.post('/', requireRole('TRAINING_CENTRE', 'ADMIN'), createBatch);
router.get('/', getBatches);
router.get('/:id', getBatchById);
router.post('/:id/upload', requireRole('TRAINING_CENTRE', 'ADMIN'), upload.single('file'), uploadSpreadsheet);
router.post('/:id/submit', requireRole('TRAINING_CENTRE', 'ADMIN'), submitBatch);
router.post('/:id/return', requireRole('DISTRICT_OFFICER', 'QUALITY_TEAM', 'STATE_OFFICE', 'ADMIN'), returnBatch);
router.post('/:id/resubmit', requireRole('TRAINING_CENTRE', 'ADMIN'), resubmitBatch);

export default router;


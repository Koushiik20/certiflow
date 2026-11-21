import { Router } from 'express';
import { verifyCertificate } from './verificationController';

const router = Router();

// Public endpoint - Zero authentication required!
router.get('/:certificateId', verifyCertificate);

export default router;


import { Router } from 'express';
import { getSlaMonitor } from './slaController';
import { authenticateJWT } from '../../middleware/auth';

const router = Router();

router.use(authenticateJWT);
router.get('/monitor', getSlaMonitor);

export default router;


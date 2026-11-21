import { Router } from 'express';
import { login, getMe, getDemoUsers, demoSwitch } from './authController';
import { authenticateJWT } from '../../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateJWT, getMe);
router.get('/demo-users', getDemoUsers);
router.post('/demo-switch', demoSwitch);

export default router;


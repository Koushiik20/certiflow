import { Router } from 'express';
import { getCertificates, getCertificateById, downloadCertificatePdf } from './certificateController';
import { authenticateJWT } from '../../middleware/auth';

const router = Router();

// Downloading PDF can be authenticated or directly accessible with valid certificate id
router.get('/:id/download', downloadCertificatePdf);

router.use(authenticateJWT);
router.get('/', getCertificates);
router.get('/:id', getCertificateById);

export default router;


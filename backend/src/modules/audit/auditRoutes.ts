import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateJWT } from '../../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', async (req: Request, res: Response) => {
  const { entityType, entityId, action, userId, limit = 100 } = req.query;

  const whereClause: any = {};
  if (entityType) whereClause.entityType = String(entityType);
  if (entityId) whereClause.entityId = String(entityId);
  if (action) whereClause.action = String(action);
  if (userId) whereClause.userId = String(userId);

  const logs = await prisma.auditLog.findMany({
    where: whereClause,
    orderBy: { timestamp: 'desc' },
    take: Math.min(Number(limit), 200)
  });

  res.json({ auditLogs: logs });
});

export default router;


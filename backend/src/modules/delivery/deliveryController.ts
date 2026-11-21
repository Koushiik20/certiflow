import { Request, Response } from 'express';
import { prisma } from '../../db';
import { processDeliveryJob } from '../../workers/deliveryWorker';
import { recordAuditLog } from '../audit/auditService';

export async function getDeliveries(req: Request, res: Response): Promise<void> {
  const { status, certificateId } = req.query;

  const whereClause: any = {};
  if (status) {
    whereClause.status = String(status);
  }
  if (certificateId) {
    whereClause.certificateId = String(certificateId);
  }

  const deliveries = await prisma.deliveryJob.findMany({
    where: whereClause,
    include: {
      certificate: true,
      candidate: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const stats = await prisma.deliveryJob.groupBy({
    by: ['status'],
    _count: { id: true }
  });

  res.json({
    deliveries,
    summary: stats.reduce((acc, curr) => ({ ...acc, [curr.status]: curr._count.id }), {})
  });
}

export async function retryDelivery(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;

  const job = await prisma.deliveryJob.findUnique({
    where: { id },
    include: { certificate: true, candidate: true }
  });

  if (!job) {
    res.status(404).json({ error: 'Delivery job not found.' });
    return;
  }

  // Reset job status to PENDING and trigger execution
  await prisma.deliveryJob.update({
    where: { id },
    data: {
      status: 'PENDING',
      lastError: null,
      attemptCount: 0,
      nextRetryAt: new Date()
    }
  });

  await recordAuditLog({
    userId: user.id,
    userRole: user.role,
    action: 'DELIVERY_MANUAL_RETRY_INITIATED',
    entityType: 'DELIVERY_JOB',
    entityId: id,
    newState: { status: 'PENDING' }
  });

  // Execute job asynchronously in worker
  setImmediate(async () => {
    try {
      await processDeliveryJob(id);
    } catch (err) {
      console.error('[Delivery Retry Error]', err);
    }
  });

  res.json({
    success: true,
    message: `Delivery job ${id} has been queued for manual re-dispatch.`
  });
}


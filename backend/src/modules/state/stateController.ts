import { Request, Response } from 'express';
import { prisma } from '../../db';
import { recordAuditLog } from '../audit/auditService';
import { eventBus } from '../../events/eventBus';

export async function finalApproveBatch(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;
  const { comments } = req.body;

  const batch = await prisma.batch.findUnique({
    where: { id },
    include: { candidates: true }
  });

  if (!batch) {
    res.status(404).json({ error: 'Batch not found.' });
    return;
  }

  if (batch.status !== 'STATE_REVIEW') {
    res.status(400).json({ error: `State final approval can only be performed on batches in 'STATE_REVIEW'. Current status: '${batch.status}'.` });
    return;
  }

  const updatedBatch = await prisma.$transaction(async (tx) => {
    await tx.approval.create({
      data: {
        batchId: batch.id,
        revision: batch.currentRevision,
        officerId: user.id,
        role: 'STATE_OFFICE',
        decision: 'APPROVED',
        comments: comments || 'State final authorization granted. Approved for issuance.',
        isSuperseded: false
      }
    });

    return await tx.batch.update({
      where: { id: batch.id },
      data: {
        status: 'APPROVED',
        slaStageEnteredAt: new Date(),
        isOverdue: false
      }
    });
  });

  await recordAuditLog({
    userId: user.id,
    userRole: user.role,
    action: 'STATE_FINAL_APPROVAL_GRANTED',
    entityType: 'BATCH',
    entityId: batch.id,
    newState: { status: 'APPROVED', revision: batch.currentRevision }
  });

  // Trigger automated certificate generation & delivery pipeline!
  await eventBus.publish('BatchApproved', { batchId: batch.id });

  res.json({
    success: true,
    message: `Batch ${batch.batchNumber} has received State Final Approval. Automated certificate generation & delivery process initiated.`,
    batch: updatedBatch
  });
}

export async function cancelCertificate(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;
  const { reason } = req.body;

  if (!reason || reason.trim().length < 5) {
    res.status(400).json({ error: 'A detailed cancellation justification reason of at least 5 characters is required.' });
    return;
  }

  const cert = await prisma.certificate.findUnique({
    where: { id },
    include: { candidate: true, batch: true }
  });

  if (!cert) {
    res.status(404).json({ error: 'Certificate not found.' });
    return;
  }

  if (cert.status === 'CANCELLED') {
    res.status(400).json({ error: `Certificate ${cert.certificateNumber} is already CANCELLED.` });
    return;
  }

  const updatedCert = await prisma.certificate.update({
    where: { id: cert.id },
    data: {
      status: 'CANCELLED',
      cancellationReason: reason.trim(),
      cancelledAt: new Date(),
      cancelledByUserId: user.id
    }
  });

  await recordAuditLog({
    userId: user.id,
    userRole: user.role,
    action: 'CERTIFICATE_CANCELLED',
    entityType: 'CERTIFICATE',
    entityId: cert.id,
    previousState: { status: 'VALID' },
    newState: { status: 'CANCELLED', reason, cancelledBy: user.name }
  });

  await eventBus.publish('CertificateCancelled', {
    certificateId: cert.id,
    certificateNumber: cert.certificateNumber,
    reason
  });

  res.json({
    success: true,
    message: `Certificate ${cert.certificateNumber} has been permanently revoked/cancelled. Public verification will immediately reflect this status.`,
    certificate: updatedCert
  });
}

export async function getPlatformAnalytics(_req: Request, res: Response): Promise<void> {
  const [
    totalBatches,
    batchesByStatus,
    totalCertificates,
    validCertificates,
    cancelledCertificates,
    totalDeliveries,
    deliveredCount,
    failedDeliveries,
    overdueBatchesCount
  ] = await Promise.all([
    prisma.batch.count(),
    prisma.batch.groupBy({
      by: ['status'],
      _count: { id: true }
    }),
    prisma.certificate.count(),
    prisma.certificate.count({ where: { status: 'VALID' } }),
    prisma.certificate.count({ where: { status: 'CANCELLED' } }),
    prisma.deliveryJob.count(),
    prisma.deliveryJob.count({ where: { status: 'DELIVERED' } }),
    prisma.deliveryJob.count({ where: { status: 'FAILED' } }),
    prisma.batch.count({ where: { isOverdue: true } })
  ]);

  res.json({
    analytics: {
      batches: {
        total: totalBatches,
        overdue: overdueBatchesCount,
        byStatus: batchesByStatus.reduce((acc, curr) => ({ ...acc, [curr.status]: curr._count.id }), {})
      },
      certificates: {
        total: totalCertificates,
        valid: validCertificates,
        cancelled: cancelledCertificates,
      },
      deliveries: {
        total: totalDeliveries,
        delivered: deliveredCount,
        failed: failedDeliveries,
        successRate: totalDeliveries > 0 ? ((deliveredCount / totalDeliveries) * 100).toFixed(1) + '%' : '100%'
      }
    }
  });
}


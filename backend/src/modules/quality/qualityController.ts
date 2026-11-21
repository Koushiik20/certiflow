import { Request, Response } from 'express';
import { prisma } from '../../db';
import { recordAuditLog } from '../audit/auditService';
import { eventBus } from '../../events/eventBus';

export async function getPendingQualityBatches(_req: Request, res: Response): Promise<void> {
  const batches = await prisma.batch.findMany({
    where: { status: 'QUALITY_REVIEW' },
    include: {
      trainingCentre: true,
      district: true,
      candidates: {
        include: { candidate: true },
        orderBy: { rawRowNumber: 'asc' }
      },
      approvals: {
        include: { officer: true }
      }
    },
    orderBy: { slaStageEnteredAt: 'asc' }
  });

  res.json({ batches });
}

export async function flagCandidate(req: Request, res: Response): Promise<void> {
  const { batchId, candidateId } = req.params;
  const { reason, status } = req.body;
  const user = req.user!;

  const bc = await prisma.batchCandidate.findUnique({
    where: {
      batchId_candidateId: {
        batchId,
        candidateId
      }
    }
  });

  if (!bc) {
    res.status(404).json({ error: 'Candidate record not found in this batch.' });
    return;
  }

  const updatedBc = await prisma.batchCandidate.update({
    where: {
      batchId_candidateId: {
        batchId,
        candidateId
      }
    },
    data: {
      status: status || 'FLAGGED',
      flagReason: reason || 'Flagged by Quality Team for manual audit.'
    }
  });

  await recordAuditLog({
    userId: user.id,
    userRole: user.role,
    action: 'CANDIDATE_FLAGGED_BY_QUALITY',
    entityType: 'CANDIDATE',
    entityId: candidateId,
    metadata: { batchId, reason }
  });

  res.json({ success: true, candidate: updatedBc });
}

export async function submitQualityReview(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { decision, comments } = req.body; // APPROVED, REJECTED, RETURNED
  const user = req.user!;

  if (!['APPROVED', 'REJECTED', 'RETURNED'].includes(decision)) {
    res.status(400).json({ error: "Decision must be 'APPROVED', 'REJECTED', or 'RETURNED'." });
    return;
  }

  const batch = await prisma.batch.findUnique({
    where: { id },
    include: { candidates: true }
  });

  if (!batch) {
    res.status(404).json({ error: 'Batch not found.' });
    return;
  }

  if (batch.status !== 'QUALITY_REVIEW') {
    res.status(400).json({ error: `Batch status is '${batch.status}'. Quality review can only be submitted for batches in 'QUALITY_REVIEW'.` });
    return;
  }

  if (decision === 'APPROVED') {
    // If approved, check if there are flagged candidates
    const flaggedCount = batch.candidates.filter((c) => c.status === 'FLAGGED').length;

    const updatedBatch = await prisma.$transaction(async (tx) => {
      await tx.approval.create({
        data: {
          batchId: batch.id,
          revision: batch.currentRevision,
          officerId: user.id,
          role: 'QUALITY_TEAM',
          decision: 'APPROVED',
          comments: comments || `Quality review cleared. ${flaggedCount} candidates flagged/excluded.`,
          isSuperseded: false
        }
      });

      return await tx.batch.update({
        where: { id: batch.id },
        data: {
          status: 'STATE_REVIEW',
          slaStageEnteredAt: new Date(),
          isOverdue: false
        }
      });
    });

    await recordAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'QUALITY_REVIEW_APPROVED',
      entityType: 'BATCH',
      entityId: batch.id,
      newState: { status: 'STATE_REVIEW', flaggedExcluded: flaggedCount }
    });

    await eventBus.publish('QualityReviewCompleted', { batchId: batch.id, decision: 'APPROVED' });

    res.json({
      success: true,
      message: 'Quality review approved. Batch routed to STATE_REVIEW.',
      batch: updatedBatch
    });
  } else if (decision === 'RETURNED') {
    const updatedBatch = await prisma.$transaction(async (tx) => {
      await tx.approval.updateMany({
        where: { batchId: batch.id, isSuperseded: false },
        data: { isSuperseded: true }
      });

      await tx.approval.upsert({
        where: {
          batchId_revision_officerId: {
            batchId: batch.id,
            revision: batch.currentRevision,
            officerId: user.id
          }
        },
        update: {
          decision: 'RETURNED',
          comments: comments || 'Returned by Quality Team for discrepancies.',
          isSuperseded: true
        },
        create: {
          batchId: batch.id,
          revision: batch.currentRevision,
          officerId: user.id,
          role: 'QUALITY_TEAM',
          decision: 'RETURNED',
          comments: comments || 'Returned by Quality Team for discrepancies.',
          isSuperseded: true
        }
      });

      return await tx.batch.update({
        where: { id: batch.id },
        data: {
          status: 'RETURNED',
          returnReason: comments,
          currentRevision: batch.currentRevision + 1,
          slaStageEnteredAt: new Date(),
          isOverdue: false
        }
      });
    });

    await recordAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'QUALITY_REVIEW_RETURNED',
      entityType: 'BATCH',
      entityId: batch.id,
      newState: { status: 'RETURNED', revision: updatedBatch.currentRevision }
    });

    res.json({
      success: true,
      message: `Batch returned to training centre by Quality Team. Revision incremented to ${updatedBatch.currentRevision}.`,
      batch: updatedBatch
    });
  } else {
    // REJECTED
    const updatedBatch = await prisma.$transaction(async (tx) => {
      await tx.approval.create({
        data: {
          batchId: batch.id,
          revision: batch.currentRevision,
          officerId: user.id,
          role: 'QUALITY_TEAM',
          decision: 'REJECTED',
          comments: comments || 'Batch rejected due to critical quality audit failures.',
          isSuperseded: false
        }
      });

      return await tx.batch.update({
        where: { id: batch.id },
        data: {
          status: 'REJECTED',
          rejectionReason: comments,
          slaStageEnteredAt: new Date(),
          isOverdue: false
        }
      });
    });

    await recordAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'QUALITY_REVIEW_REJECTED',
      entityType: 'BATCH',
      entityId: batch.id,
      newState: { status: 'REJECTED' }
    });

    res.json({
      success: true,
      message: 'Batch permanently rejected by Quality Team.',
      batch: updatedBatch
    });
  }
}

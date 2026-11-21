import { Request, Response } from 'express';
import { prisma } from '../../db';
import { config } from '../../config';
import { recordAuditLog } from '../audit/auditService';
import { eventBus } from '../../events/eventBus';

export async function approveBatchDistrict(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;
  const { comments } = req.body;

  // 1. Training centres must NEVER approve their own batches
  if (user.role === 'TRAINING_CENTRE') {
    res.status(403).json({ error: 'Training centres are strictly prohibited from approving batches.' });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Lock batch by reading within transaction
      const batch = await tx.batch.findUnique({
        where: { id },
        include: {
          approvals: {
            where: {
              role: 'DISTRICT_OFFICER',
              decision: 'APPROVED',
              isSuperseded: false,
            }
          }
        }
      });

      if (!batch) {
        throw { statusCode: 404, message: 'Batch not found.' };
      }

      if (batch.status !== 'DISTRICT_REVIEW') {
        throw {
          statusCode: 400,
          message: `Batch is in '${batch.status}' status. District approvals can only be given when status is 'DISTRICT_REVIEW'.`
        };
      }

      // Filter approvals matching current revision
      const currentRevApprovals = batch.approvals.filter((a) => a.revision === batch.currentRevision);

      // Check rule: Officer cannot approve same batch revision twice
      const alreadyApproved = currentRevApprovals.some((a) => a.officerId === user.id);
      if (alreadyApproved) {
        throw {
          statusCode: 400,
          message: `Officer ${user.name} has already approved batch revision ${batch.currentRevision}. A batch requires two DISTINCT district officer approvals.`
        };
      }

      // Record the new approval
      const newApproval = await tx.approval.create({
        data: {
          batchId: batch.id,
          revision: batch.currentRevision,
          officerId: user.id,
          role: 'DISTRICT_OFFICER',
          decision: 'APPROVED',
          comments: comments || 'District approval granted.',
          isSuperseded: false
        }
      });

      const totalApprovalsCount = currentRevApprovals.length + 1;

      if (totalApprovalsCount < 2) {
        // Needs second distinct district officer
        return {
          batch,
          approval: newApproval,
          approvalsCount: totalApprovalsCount,
          nextStage: 'DISTRICT_REVIEW',
          message: `First district approval recorded by ${user.name}. Awaiting second district officer approval.`
        };
      } else {
        // 2 distinct district approvals achieved!
        // Check threshold for Quality Review (> 50 candidates by default)
        const requiresQualityReview = batch.candidateCount > config.qualityReviewThreshold;
        const nextStatus = requiresQualityReview ? 'QUALITY_REVIEW' : 'STATE_REVIEW';

        const updatedBatch = await tx.batch.update({
          where: { id: batch.id },
          data: {
            status: nextStatus,
            slaStageEnteredAt: new Date(),
            isOverdue: false
          }
        });

        return {
          batch: updatedBatch,
          approval: newApproval,
          approvalsCount: totalApprovalsCount,
          nextStage: nextStatus,
          message: requiresQualityReview
            ? `Two distinct district approvals recorded. Candidate count (${batch.candidateCount}) exceeds threshold (${config.qualityReviewThreshold}). Routed to QUALITY_REVIEW.`
            : `Two distinct district approvals recorded. Batch routed to STATE_REVIEW for final state approval.`
        };
      }
    });

    await recordAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'DISTRICT_APPROVAL_RECORDED',
      entityType: 'BATCH',
      entityId: id,
      metadata: {
        revision: result.batch.currentRevision,
        approvalsCount: result.approvalsCount,
        nextStage: result.nextStage
      }
    });

    await eventBus.publish('DistrictApprovalReceived', {
      batchId: id,
      approvalsCount: result.approvalsCount,
      nextStage: result.nextStage
    });

    res.json({
      success: true,
      message: result.message,
      batch: result.batch,
      approvalsCount: result.approvalsCount,
      nextStage: result.nextStage
    });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Approval processing failed.' });
  }
}

export async function rejectBatchDistrict(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;
  const { reason } = req.body;

  if (!reason || reason.trim().length < 5) {
    res.status(400).json({ error: 'A rejection reason of at least 5 characters is required.' });
    return;
  }

  const batch = await prisma.batch.findUnique({ where: { id } });
  if (!batch) {
    res.status(404).json({ error: 'Batch not found.' });
    return;
  }

  if (batch.status !== 'DISTRICT_REVIEW') {
    res.status(400).json({ error: `Cannot reject batch from status '${batch.status}'.` });
    return;
  }

  const updatedBatch = await prisma.$transaction(async (tx) => {
    await tx.approval.upsert({
      where: {
        batchId_revision_officerId: {
          batchId: batch.id,
          revision: batch.currentRevision,
          officerId: user.id
        }
      },
      update: {
        decision: 'REJECTED',
        comments: reason.trim(),
        isSuperseded: false
      },
      create: {
        batchId: batch.id,
        revision: batch.currentRevision,
        officerId: user.id,
        role: user.role,
        decision: 'REJECTED',
        comments: reason.trim(),
        isSuperseded: false
      }
    });

    return await tx.batch.update({
      where: { id: batch.id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason.trim(),
        slaStageEnteredAt: new Date(),
        isOverdue: false
      }
    });
  });

  await recordAuditLog({
    userId: user.id,
    userRole: user.role,
    action: 'BATCH_REJECTED',
    entityType: 'BATCH',
    entityId: batch.id,
    previousState: { status: batch.status },
    newState: { status: 'REJECTED', reason }
  });

  res.json({
    success: true,
    message: `Batch ${batch.batchNumber} has been rejected. It cannot proceed to certificate issuance.`,
    batch: updatedBatch
  });
}

export async function getBatchApprovals(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const approvals = await prisma.approval.findMany({
    where: { batchId: id },
    include: {
      officer: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ approvals });
}

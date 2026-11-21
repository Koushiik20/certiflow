import { Request, Response } from 'express';
import { prisma } from '../../db';
import { config } from '../../config';

export async function getSlaMonitor(_req: Request, res: Response): Promise<void> {
  const now = new Date();

  // Find all in-flight batches (not in terminal states)
  const activeBatches = await prisma.batch.findMany({
    where: {
      status: {
        in: ['SUBMITTED', 'DISTRICT_REVIEW', 'QUALITY_REVIEW', 'STATE_REVIEW']
      }
    },
    include: {
      district: true,
      trainingCentre: true,
      approvals: {
        include: { officer: true }
      }
    },
    orderBy: { slaStageEnteredAt: 'asc' }
  });

  const batchesWithSla = activeBatches.map((b) => {
    const stage = b.status as keyof typeof config.slaHours;
    const maxHours = config.slaHours[stage] || 24;
    const enteredAt = new Date(b.slaStageEnteredAt);
    const elapsedHours = (now.getTime() - enteredAt.getTime()) / (1000 * 60 * 60);
    const isOverdue = elapsedHours > maxHours;
    const remainingHours = Math.max(0, maxHours - elapsedHours);

    return {
      ...b,
      slaTargetHours: maxHours,
      elapsedHours: Math.round(elapsedHours * 10) / 10,
      remainingHours: Math.round(remainingHours * 10) / 10,
      isOverdue,
    };
  });

  const overdueCount = batchesWithSla.filter((b) => b.isOverdue).length;

  res.json({
    summary: {
      totalActive: batchesWithSla.length,
      overdueCount,
      slaConfig: config.slaHours
    },
    batches: batchesWithSla
  });
}


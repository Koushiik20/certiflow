import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../../db';
import { config } from '../../config';

export async function getCertificates(req: Request, res: Response): Promise<void> {
  const { batchId, candidateId, status, search } = req.query;
  const user = req.user!;

  const whereClause: any = {};

  if (user.role === 'TRAINING_CENTRE' && user.trainingCentreId) {
    whereClause.batch = { trainingCentreId: user.trainingCentreId };
  }

  if (batchId) {
    whereClause.batchId = String(batchId);
  }

  if (candidateId) {
    whereClause.candidateId = String(candidateId);
  }

  if (status) {
    whereClause.status = String(status);
  }

  if (search) {
    const q = String(search).trim();
    whereClause.OR = [
      { certificateNumber: { contains: q } },
      { candidateNameSnapshot: { contains: q } },
      { courseNameSnapshot: { contains: q } },
    ];
  }

  const certificates = await prisma.certificate.findMany({
    where: whereClause,
    include: {
      batch: {
        include: { trainingCentre: true, district: true }
      },
      candidate: true,
      deliveryJobs: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { issueDate: 'desc' }
  });

  res.json({ certificates });
}

export async function getCertificateById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const certificate = await prisma.certificate.findUnique({
    where: { id },
    include: {
      batch: {
        include: { trainingCentre: true, district: true }
      },
      candidate: true,
      deliveryJobs: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!certificate) {
    res.status(404).json({ error: 'Certificate not found.' });
    return;
  }

  res.json({ certificate });
}

export async function downloadCertificatePdf(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const certificate = await prisma.certificate.findUnique({
    where: { id }
  });

  if (!certificate) {
    res.status(404).json({ error: 'Certificate not found.' });
    return;
  }

  const filename = `${certificate.certificateNumber}.pdf`;
  const filePath = path.join(config.storageDir, 'certificates', filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Certificate PDF file not found on storage disk.' });
    return;
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}


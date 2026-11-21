import { Request, Response } from 'express';
import { prisma } from '../../db';
import { parseAndValidateSpreadsheet, generateSampleExcelBuffer } from '../../utils/excelParser';
import { recordAuditLog } from '../audit/auditService';
import { eventBus } from '../../events/eventBus';

export async function createBatch(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { title, courseName, courseCode, startDate, completionDate, districtId, trainingCentreId } = req.body;

  if (!title || !courseName || !courseCode || !startDate || !completionDate) {
    res.status(400).json({ error: 'All batch core fields are required.' });
    return;
  }

  // Determine training centre & district
  let tcId = user.trainingCentreId || trainingCentreId;
  let distId = user.districtId || districtId;

  if (!tcId) {
    // If not set, use default or first training centre
    const defaultTc = await prisma.trainingCentre.findFirst();
    if (!defaultTc) {
      res.status(400).json({ error: 'No training centres exist in the system.' });
      return;
    }
    tcId = defaultTc.id;
    distId = defaultTc.districtId;
  }

  if (!distId) {
    const tc = await prisma.trainingCentre.findUnique({ where: { id: tcId } });
    distId = tc?.districtId;
  }

  const year = new Date().getFullYear();
  let nextSeq = (await prisma.batch.count()) + 1;
  let batchNumber = `BATCH-${year}-${String(nextSeq).padStart(4, '0')}`;
  while (await prisma.batch.findUnique({ where: { batchNumber } })) {
    nextSeq++;
    batchNumber = `BATCH-${year}-${String(nextSeq).padStart(4, '0')}`;
  }

  const batch = await prisma.batch.create({
    data: {
      batchNumber,
      title,
      courseName,
      courseCode: courseCode.trim().toUpperCase(),
      trainingCentreId: tcId,
      districtId: distId!,
      startDate: new Date(startDate),
      completionDate: new Date(completionDate),
      status: 'DRAFT',
      currentRevision: 1,
      candidateCount: 0,
      slaStageEnteredAt: new Date(),
    },
    include: {
      trainingCentre: true,
      district: true
    }
  });

  await recordAuditLog({
    userId: user.id,
    userRole: user.role,
    action: 'BATCH_CREATED',
    entityType: 'BATCH',
    entityId: batch.id,
    newState: { batchNumber, title, courseCode }
  });

  res.status(201).json({ batch });
}

export async function getBatches(req: Request, res: Response): Promise<void> {
  const { status, districtId, trainingCentreId, search, overdue } = req.query;
  const user = req.user!;

  const whereClause: any = {};

  // Role scoping
  if (user.role === 'TRAINING_CENTRE' && user.trainingCentreId) {
    whereClause.trainingCentreId = user.trainingCentreId;
  } else if (user.role === 'DISTRICT_OFFICER' && user.districtId) {
    whereClause.districtId = user.districtId;
  }

  if (status && status !== 'ALL') {
    whereClause.status = String(status);
  }

  if (districtId) {
    whereClause.districtId = String(districtId);
  }

  if (trainingCentreId) {
    whereClause.trainingCentreId = String(trainingCentreId);
  }

  if (overdue === 'true') {
    whereClause.isOverdue = true;
  }

  if (search) {
    const query = String(search).trim();
    whereClause.OR = [
      { batchNumber: { contains: query } },
      { title: { contains: query } },
      { courseName: { contains: query } },
      { courseCode: { contains: query } }
    ];
  }

  const batches = await prisma.batch.findMany({
    where: whereClause,
    include: {
      trainingCentre: true,
      district: true,
      approvals: {
        where: { isSuperseded: false },
        include: { officer: true }
      },
      _count: {
        select: { candidates: true, certificates: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ batches });
}

export async function getBatchById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      trainingCentre: true,
      district: true,
      candidates: {
        include: {
          candidate: true
        },
        orderBy: { rawRowNumber: 'asc' }
      },
      approvals: {
        include: {
          officer: true
        },
        orderBy: { createdAt: 'desc' }
      },
      certificates: {
        include: {
          deliveryJobs: true
        }
      }
    }
  });

  if (!batch) {
    res.status(404).json({ error: 'Batch not found.' });
    return;
  }

  res.json({ batch });
}

export async function uploadSpreadsheet(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;

  if (!req.file) {
    res.status(400).json({ error: 'Spreadsheet file (.xlsx, .xls, .csv) is required.' });
    return;
  }

  const batch = await prisma.batch.findUnique({
    where: { id },
  });

  if (!batch) {
    res.status(404).json({ error: 'Batch not found.' });
    return;
  }

  if (!['DRAFT', 'RETURNED'].includes(batch.status)) {
    res.status(400).json({
      error: `Cannot upload candidates to a batch with status '${batch.status}'. Batch must be in DRAFT or RETURNED state.`
    });
    return;
  }

  // Parse and validate using SheetJS engine
  const validation = parseAndValidateSpreadsheet(req.file.buffer, batch.courseCode);

  if (!validation.isValid) {
    // Report detailed row-indexed validation errors. No partial data saved!
    res.status(400).json({
      success: false,
      error: 'Spreadsheet validation failed with critical errors. No records were saved.',
      summary: {
        totalRows: validation.totalRows,
        errorCount: validation.errorCount,
        validRowsCount: validation.validRowsCount,
      },
      errors: validation.errors
    });
    return;
  }

  // Atomic database transaction: Save all candidates or rollback completely
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Remove any existing candidates for this batch
      await tx.batchCandidate.deleteMany({
        where: { batchId: batch.id }
      });

      // 2. Upsert candidates and link them to this batch
      for (const item of validation.candidates) {
        const candidate = await tx.candidate.upsert({
          where: { candidateIdentifier: item.candidateIdentifier! },
          update: {
            fullName: item.candidateName,
            phone: item.phoneNumber,
            email: item.email || null,
          },
          create: {
            candidateIdentifier: item.candidateIdentifier!,
            fullName: item.candidateName,
            phone: item.phoneNumber,
            email: item.email || null,
          }
        });

        await tx.batchCandidate.create({
          data: {
            batchId: batch.id,
            candidateId: candidate.id,
            marks: item.marks,
            result: item.result,
            status: item.result === 'PASS' ? 'VALIDATED' : 'FAILED',
            rawRowNumber: item.rowNumber,
          }
        });
      }

      // 3. Update batch candidate count
      await tx.batch.update({
        where: { id: batch.id },
        data: {
          candidateCount: validation.candidates.length,
          updatedAt: new Date()
        }
      });
    });

    await recordAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'CANDIDATES_UPLOADED',
      entityType: 'BATCH',
      entityId: batch.id,
      newState: { candidateCount: validation.candidates.length, revision: batch.currentRevision }
    });

    res.json({
      success: true,
      message: `Successfully validated and imported ${validation.candidates.length} candidate records.`,
      summary: {
        totalRows: validation.totalRows,
        importedCount: validation.candidates.length,
        errorCount: 0
      }
    });
  } catch (err: any) {
    console.error('[Batch Upload Transaction Error]', err);
    res.status(500).json({
      error: 'Database transaction failed during candidate import. All changes rolled back.',
      details: err.message
    });
  }
}

export async function submitBatch(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;

  const batch = await prisma.batch.findUnique({
    where: { id },
    include: { candidates: true }
  });

  if (!batch) {
    res.status(404).json({ error: 'Batch not found.' });
    return;
  }

  if (batch.status !== 'DRAFT') {
    res.status(400).json({ error: `Cannot submit batch in status '${batch.status}'. Must be in DRAFT.` });
    return;
  }

  if (batch.candidates.length === 0) {
    res.status(400).json({ error: 'Cannot submit a batch with zero candidate records. Please upload spreadsheet first.' });
    return;
  }

  // Transition: DRAFT -> DISTRICT_REVIEW
  const updatedBatch = await prisma.batch.update({
    where: { id: batch.id },
    data: {
      status: 'DISTRICT_REVIEW',
      slaStageEnteredAt: new Date(),
      isOverdue: false,
    }
  });

  await recordAuditLog({
    userId: user.id,
    userRole: user.role,
    action: 'BATCH_SUBMITTED',
    entityType: 'BATCH',
    entityId: batch.id,
    previousState: { status: 'DRAFT' },
    newState: { status: 'DISTRICT_REVIEW' }
  });

  await eventBus.publish('BatchSubmitted', { batchId: batch.id, candidateCount: batch.candidateCount });

  res.json({
    success: true,
    message: 'Batch successfully submitted for District Officer review.',
    batch: updatedBatch
  });
}

export async function returnBatch(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;
  const { reason } = req.body;

  if (!reason || reason.trim().length < 5) {
    res.status(400).json({ error: 'A specific return justification reason of at least 5 characters is required.' });
    return;
  }

  const batch = await prisma.batch.findUnique({
    where: { id },
    include: { approvals: true }
  });

  if (!batch) {
    res.status(404).json({ error: 'Batch not found.' });
    return;
  }

  if (['DRAFT', 'ISSUING', 'ISSUED', 'REJECTED', 'CANCELLED'].includes(batch.status)) {
    res.status(400).json({ error: `Cannot return a batch with status '${batch.status}'.` });
    return;
  }

  // Atomic return transaction: Increment revision and mark prior approvals superseded
  const updatedBatch = await prisma.$transaction(async (tx) => {
    // Invalidate existing approvals for this revision
    await tx.approval.updateMany({
      where: { batchId: batch.id, isSuperseded: false },
      data: { isSuperseded: true }
    });

    // Record the RETURNED decision (upsert to handle case where officer already voted on this revision)
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
        comments: reason.trim(),
        isSuperseded: true
      },
      create: {
        batchId: batch.id,
        revision: batch.currentRevision,
        officerId: user.id,
        role: user.role,
        decision: 'RETURNED',
        comments: reason.trim(),
        isSuperseded: true
      }
    });

    // Increment revision and set status to RETURNED
    return await tx.batch.update({
      where: { id: batch.id },
      data: {
        status: 'RETURNED',
        returnReason: reason.trim(),
        currentRevision: batch.currentRevision + 1,
        slaStageEnteredAt: new Date(),
        isOverdue: false
      }
    });
  });

  await recordAuditLog({
    userId: user.id,
    userRole: user.role,
    action: 'BATCH_RETURNED_FOR_CORRECTION',
    entityType: 'BATCH',
    entityId: batch.id,
    previousState: { status: batch.status, revision: batch.currentRevision },
    newState: { status: 'RETURNED', revision: updatedBatch.currentRevision, reason }
  });

  res.json({
    success: true,
    message: `Batch returned to Training Centre for correction. Revision incremented to ${updatedBatch.currentRevision}. Previous approvals invalidated.`,
    batch: updatedBatch
  });
}

export async function resubmitBatch(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;

  const batch = await prisma.batch.findUnique({
    where: { id },
    include: { candidates: true }
  });

  if (!batch) {
    res.status(404).json({ error: 'Batch not found.' });
    return;
  }

  if (batch.status !== 'RETURNED') {
    res.status(400).json({ error: `Only batches in 'RETURNED' status can be resubmitted. Current status is '${batch.status}'.` });
    return;
  }

  if (batch.candidates.length === 0) {
    res.status(400).json({ error: 'Cannot resubmit batch with 0 candidates.' });
    return;
  }

  const updatedBatch = await prisma.batch.update({
    where: { id: batch.id },
    data: {
      status: 'DISTRICT_REVIEW',
      returnReason: null,
      slaStageEnteredAt: new Date(),
      isOverdue: false
    }
  });

  await recordAuditLog({
    userId: user.id,
    userRole: user.role,
    action: 'BATCH_RESUBMITTED',
    entityType: 'BATCH',
    entityId: batch.id,
    newState: { status: 'DISTRICT_REVIEW', revision: batch.currentRevision }
  });

  await eventBus.publish('BatchSubmitted', { batchId: batch.id, revision: batch.currentRevision });

  res.json({
    success: true,
    message: `Batch revision ${batch.currentRevision} successfully resubmitted. Fresh district reviews initiated.`,
    batch: updatedBatch
  });
}

export async function downloadExcelTemplate(_req: Request, res: Response): Promise<void> {
  const buffer = generateSampleExcelBuffer();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="certiflow_candidates_template.xlsx"');
  res.send(buffer);
}

export async function downloadSampleFile(req: Request, res: Response): Promise<void> {
  const { type } = req.params; // 'valid', 'large', 'errors'
  const pathModule = await import('path');
  const fsModule = await import('fs');

  let filename = 'sample_valid_candidates.xlsx';
  if (type === 'large') {
    filename = 'sample_large_cohort_55.xlsx';
  } else if (type === 'errors') {
    filename = 'sample_with_validation_errors.xlsx';
  }

  const filePath = pathModule.resolve(__dirname, '../../../../sample_data', filename);

  if (!fsModule.existsSync(filePath)) {
    res.status(404).json({ error: 'Sample file not found.' });
    return;
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  const stream = fsModule.createReadStream(filePath);
  stream.pipe(res);
}

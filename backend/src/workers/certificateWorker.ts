import path from 'path';
import { prisma } from '../db';
import { config } from '../config';
import { generateCertificatePDF, CertificateTemplateData } from '../utils/pdfGenerator';
import { generateQrDataUrl } from '../utils/qrGenerator';
import { eventBus } from '../events/eventBus';
import { recordAuditLog } from '../modules/audit/auditService';

export async function processBatchCertificateGeneration(batchId: string): Promise<number> {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      trainingCentre: true,
      district: true,
      candidates: {
        where: {
          result: 'PASS',
          status: { not: 'FLAGGED' }
        },
        include: {
          candidate: true
        }
      }
    }
  });

  if (!batch) {
    throw new Error(`Batch with ID '${batchId}' not found.`);
  }

  // Update batch status to ISSUING
  await prisma.batch.update({
    where: { id: batchId },
    data: { status: 'ISSUING' }
  });

  console.log(`[Certificate Worker] Generating certificates for Batch ${batch.batchNumber} (${batch.candidates.length} passing candidates)...`);

  let generatedCount = 0;
  const year = new Date().getFullYear();

  for (let i = 0; i < batch.candidates.length; i++) {
    const bc = batch.candidates[i];
    const candidate = bc.candidate;

    // Check if certificate already exists (Idempotency Guard)
    const existingCert = await prisma.certificate.findFirst({
      where: {
        batchId: batch.id,
        candidateId: candidate.id
      }
    });

    if (existingCert) {
      console.log(`[Certificate Worker] Certificate already exists for candidate ${candidate.fullName}: ${existingCert.certificateNumber}`);
      continue;
    }

    // Format unique sequential certificate number (collision-safe)
    const count = await prisma.certificate.count();
    let seq = count + 1;
    let certificateNumber = `CERT-${year}-${String(seq).padStart(6, '0')}`;
    while (await prisma.certificate.findUnique({ where: { certificateNumber } })) {
      seq++;
      certificateNumber = `CERT-${year}-${String(seq).padStart(6, '0')}`;
    }
    const publicVerificationUrl = `${config.publicBaseUrl}/verify/${certificateNumber}`;
    const outputFilename = `${certificateNumber}.pdf`;
    const outputFilePath = path.join(config.storageDir, 'certificates', outputFilename);

    const templateData: CertificateTemplateData = {
      certificateNumber,
      candidateName: candidate.fullName,
      courseName: batch.courseName,
      courseCode: batch.courseCode,
      trainingCentreName: batch.trainingCentre.name,
      districtName: batch.district.name,
      completionDate: batch.completionDate,
      issueDate: new Date(),
      issuingAuthority: 'State Skilling & Vocational Training Directorate',
      publicVerificationUrl,
      marks: bc.marks
    };

    const qrDataUrl = await generateQrDataUrl(publicVerificationUrl);
    const { hash } = await generateCertificatePDF(templateData, outputFilePath);

    // Persist Certificate Record in PostgreSQL
    const certificate = await prisma.certificate.create({
      data: {
        certificateNumber,
        batchId: batch.id,
        candidateId: candidate.id,
        candidateNameSnapshot: candidate.fullName,
        courseNameSnapshot: batch.courseName,
        trainingCentreSnapshot: batch.trainingCentre.name,
        completionDate: batch.completionDate,
        issueDate: new Date(),
        issuingAuthority: 'State Skilling & Vocational Training Directorate',
        certificateHash: hash,
        pdfUrl: `/uploads/certificates/${outputFilename}`,
        qrCodeDataUrl: qrDataUrl,
        status: 'VALID'
      }
    });

    // Create WhatsApp Delivery Job
    const deliveryJob = await prisma.deliveryJob.create({
      data: {
        certificateId: certificate.id,
        candidateId: candidate.id,
        phone: candidate.phone,
        status: 'PENDING',
        attemptCount: 0,
        maxAttempts: 4,
        nextRetryAt: new Date()
      }
    });

    // Record Audit Log
    await recordAuditLog({
      action: 'CERTIFICATE_GENERATED',
      entityType: 'CERTIFICATE',
      entityId: certificate.id,
      newState: { certificateNumber, candidate: candidate.fullName },
      metadata: { batchId: batch.id, hash }
    });

    // Emit events
    await eventBus.publish('CertificateGenerated', { certificateId: certificate.id, batchId: batch.id });
    await eventBus.publish('CertificateDeliveryRequested', { deliveryJobId: deliveryJob.id });

    generatedCount++;
  }

  // Update batch status to ISSUED
  await prisma.batch.update({
    where: { id: batchId },
    data: { status: 'ISSUED' }
  });

  await recordAuditLog({
    action: 'BATCH_ISSUED',
    entityType: 'BATCH',
    entityId: batch.id,
    newState: { status: 'ISSUED', certificatesCount: generatedCount }
  });

  console.log(`[Certificate Worker] Batch ${batch.batchNumber} marked ISSUED with ${generatedCount} certificates created.`);
  return generatedCount;
}


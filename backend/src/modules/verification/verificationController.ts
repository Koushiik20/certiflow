import { Request, Response } from 'express';
import { prisma } from '../../db';

/**
 * Public Verification Endpoint - ZERO AUTH REQUIRED
 * Used by employers, government entities, and the general public scanning the QR code
 * or visiting /verify/:certificateId
 */
export async function verifyCertificate(req: Request, res: Response): Promise<void> {
  const { certificateId } = req.params;

  if (!certificateId) {
    res.status(400).json({ status: 'NOT_FOUND', error: 'Certificate Identifier is required.' });
    return;
  }

  const trimmedId = certificateId.trim().toUpperCase();

  // Support lookup by certificateNumber (e.g. CERT-2026-000001) or primary key id
  const certificate = await prisma.certificate.findFirst({
    where: {
      OR: [
        { certificateNumber: trimmedId },
        { id: trimmedId }
      ]
    },
    include: {
      batch: {
        include: {
          trainingCentre: true,
          district: true
        }
      }
    }
  });

  if (!certificate) {
    res.status(404).json({
      status: 'NOT_FOUND',
      isValid: false,
      message: `No authentic certificate record was found for ID '${trimmedId}'. It may be invalid or fraudulent.`
    });
    return;
  }

  if (certificate.status === 'CANCELLED') {
    res.json({
      status: 'CANCELLED',
      isValid: false,
      message: 'This certificate was officially REVOKED / CANCELLED by the State Directorate and is no longer valid.',
      certificate: {
        certificateNumber: certificate.certificateNumber,
        candidateName: certificate.candidateNameSnapshot,
        courseName: certificate.courseNameSnapshot,
        trainingCentre: certificate.trainingCentreSnapshot,
        completionDate: certificate.completionDate,
        issueDate: certificate.issueDate,
        status: 'CANCELLED',
        cancelledAt: certificate.cancelledAt,
        cancellationReason: certificate.cancellationReason,
        issuingAuthority: certificate.issuingAuthority
      }
    });
    return;
  }

  // Active Authentic Certificate
  res.json({
    status: 'VALID',
    isValid: true,
    message: 'Official Certificate Verified. This credential is authentic and active.',
    certificate: {
      certificateNumber: certificate.certificateNumber,
      candidateName: certificate.candidateNameSnapshot,
      courseName: certificate.courseNameSnapshot,
      trainingCentre: certificate.trainingCentreSnapshot,
      districtName: certificate.batch.district.name,
      completionDate: certificate.completionDate,
      issueDate: certificate.issueDate,
      status: 'VALID',
      issuingAuthority: certificate.issuingAuthority,
      certificateHash: certificate.certificateHash,
      pdfUrl: certificate.pdfUrl
    }
  });
}


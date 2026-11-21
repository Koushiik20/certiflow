import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { generateQrBuffer } from './qrGenerator';

export interface CertificateTemplateData {
  certificateNumber: string;
  candidateName: string;
  courseName: string;
  courseCode: string;
  trainingCentreName: string;
  districtName: string;
  completionDate: Date;
  issueDate: Date;
  issuingAuthority: string;
  publicVerificationUrl: string;
  marks?: number;
}

export function computeCertificateHash(data: CertificateTemplateData): string {
  const payload = [
    data.certificateNumber,
    data.candidateName.trim().toUpperCase(),
    data.courseCode.trim().toUpperCase(),
    data.trainingCentreName.trim().toUpperCase(),
    data.completionDate.toISOString().split('T')[0],
    data.issuingAuthority
  ].join('|');

  return crypto.createHash('sha256').update(payload).digest('hex');
}

export async function generateCertificatePDF(
  data: CertificateTemplateData,
  outputFilePath: string
): Promise<{ pdfPath: string; hash: string }> {
  // Ensure output directory exists
  const dir = path.dirname(outputFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const hash = computeCertificateHash(data);
  const qrBuffer = await generateQrBuffer(data.publicVerificationUrl);

  return new Promise((resolve, reject) => {
    // Landscape A4 certificate
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margin: 40,
    });

    const stream = fs.createWriteStream(outputFilePath);
    doc.pipe(stream);

    const width = doc.page.width;
    const height = doc.page.height;

    // Outer Navy Border
    doc.rect(20, 20, width - 40, height - 40)
      .lineWidth(3)
      .strokeColor('#0B1E36')
      .stroke();

    // Inner Gold/Accent Border
    doc.rect(26, 26, width - 52, height - 52)
      .lineWidth(1)
      .strokeColor('#B45309')
      .stroke();

    // Corner Ornaments
    const drawCorner = (x: number, y: number, flipX: number, flipY: number) => {
      doc.save();
      doc.translate(x, y);
      doc.scale(flipX, flipY);
      doc.rect(0, 0, 15, 15).lineWidth(1.5).strokeColor('#0B1E36').stroke();
      doc.restore();
    };
    drawCorner(28, 28, 1, 1);
    drawCorner(width - 43, 28, 1, 1);
    drawCorner(28, height - 43, 1, 1);
    drawCorner(width - 43, height - 43, 1, 1);

    // Header Title
    doc.fillColor('#0B1E36')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('STATE SKILLING & VOCATIONAL TRAINING DIRECTORATE', 40, 50, {
        align: 'center',
        characterSpacing: 1.5,
      });

    doc.fillColor('#475569')
      .fontSize(10)
      .font('Helvetica')
      .text('GOVERNMENT SKILLING CERTIFICATION INITIATIVE', 40, 70, {
        align: 'center',
        characterSpacing: 1,
      });

    // Divider Line
    doc.moveTo(width / 2 - 120, 88)
      .lineTo(width / 2 + 120, 88)
      .lineWidth(1.5)
      .strokeColor('#B45309')
      .stroke();

    // Certificate of Competence
    doc.fillColor('#153E75')
      .fontSize(26)
      .font('Helvetica-Bold')
      .text('CERTIFICATE OF VOCATIONAL SKILLING', 40, 105, {
        align: 'center',
      });

    // Body Prose
    doc.fillColor('#475569')
      .fontSize(12)
      .font('Helvetica-Oblique')
      .text('This is officially conferred upon', 40, 145, {
        align: 'center',
      });

    // Candidate Name
    doc.fillColor('#0B1E36')
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(data.candidateName, 40, 170, {
        align: 'center',
      });

    // Course Details
    doc.fillColor('#334155')
      .fontSize(12)
      .font('Helvetica')
      .text(
        `for successfully completing the approved curriculum and passing the assessment for`,
        40,
        210,
        { align: 'center' }
      );

    doc.fillColor('#1E3A8A')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(`${data.courseName} (${data.courseCode})`, 40, 230, {
        align: 'center',
      });

    // Training Centre & District
    doc.fillColor('#475569')
      .fontSize(11)
      .font('Helvetica')
      .text(
        `Conducted at ${data.trainingCentreName}, District of ${data.districtName}`,
        40,
        260,
        { align: 'center' }
      );

    const completionDateStr = new Date(data.completionDate).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const issueDateStr = new Date(data.issueDate).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    doc.text(
      `Assessment Completion Date: ${completionDateStr} | Issue Date: ${issueDateStr}`,
      40,
      278,
      { align: 'center' }
    );

    // QR Code for verification
    doc.image(qrBuffer, width - 180, height - 190, { width: 95, height: 95 });

    doc.fillColor('#64748B')
      .fontSize(7.5)
      .font('Helvetica')
      .text('Scan to Verify Authenticity', width - 200, height - 90, {
        width: 135,
        align: 'center',
      });

    // Signatures Section
    const sigY = height - 120;

    // Signature 1: District Commissioner
    doc.moveTo(80, sigY).lineTo(220, sigY).lineWidth(1).strokeColor('#64748B').stroke();
    doc.fillColor('#0B1E36')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('District Competency Officer', 80, sigY + 5, { width: 140, align: 'center' });
    doc.fillColor('#64748B')
      .fontSize(8)
      .font('Helvetica')
      .text('District Skilling Council', 80, sigY + 18, { width: 140, align: 'center' });

    // Signature 2: State Director
    doc.moveTo(width / 2 - 70, sigY).lineTo(width / 2 + 70, sigY).lineWidth(1).strokeColor('#64748B').stroke();
    doc.fillColor('#0B1E36')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('State Director of Skilling', width / 2 - 70, sigY + 5, { width: 140, align: 'center' });
    doc.fillColor('#64748B')
      .fontSize(8)
      .font('Helvetica')
      .text('Vocational Directorate', width / 2 - 70, sigY + 18, { width: 140, align: 'center' });

    // Bottom Metadata Footer
    doc.fillColor('#475569')
      .fontSize(8)
      .font('Helvetica-Bold')
      .text(`Certificate No: ${data.certificateNumber}`, 40, height - 60);

    doc.fillColor('#64748B')
      .fontSize(7)
      .font('Helvetica')
      .text(`Integrity Hash: ${hash}`, 40, height - 48);

    doc.text(`Verify online at: ${data.publicVerificationUrl}`, 40, height - 38);

    doc.end();

    stream.on('finish', () => {
      resolve({ pdfPath: outputFilePath, hash });
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}


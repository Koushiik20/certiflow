import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { generateCertificatePDF, CertificateTemplateData } from '../src/utils/pdfGenerator';
import { generateQrDataUrl } from '../src/utils/qrGenerator';

const prisma = new PrismaClient();

const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || './uploads');
const certStorageDir = path.join(STORAGE_DIR, 'certificates');
if (!fs.existsSync(certStorageDir)) {
  fs.mkdirSync(certStorageDir, { recursive: true });
}

async function main() {
  console.log('[Seed] Seeding CertiFlow database with Demo personas and batches...');

  const passwordHash = await bcrypt.hash('Demo@123', 10);

  // 1. Districts
  const distNorth = await prisma.district.upsert({
    where: { code: 'DIST-NORTH' },
    update: {},
    create: {
      name: 'North Skilling District',
      code: 'DIST-NORTH',
      state: 'State Directorate'
    }
  });

  const distCentral = await prisma.district.upsert({
    where: { code: 'DIST-CENTRAL' },
    update: {},
    create: {
      name: 'Central Capital District',
      code: 'DIST-CENTRAL',
      state: 'State Directorate'
    }
  });

  // 2. Training Centres
  const tcNorth = await prisma.trainingCentre.upsert({
    where: { code: 'TC-NORTH-01' },
    update: {},
    create: {
      name: 'Apex Skill Development Institute',
      code: 'TC-NORTH-01',
      districtId: distNorth.id,
      address: 'Sector 14, Industrial Training Area',
      contactEmail: 'contact@apexskills.org',
      contactPhone: '9876540001',
      active: true
    }
  });

  const tcCentral = await prisma.trainingCentre.upsert({
    where: { code: 'TC-CENTRAL-01' },
    update: {},
    create: {
      name: 'National Vocational Academy',
      code: 'TC-CENTRAL-01',
      districtId: distCentral.id,
      address: 'Block B, Technology Park',
      contactEmail: 'info@natvoc.edu',
      contactPhone: '9876540002',
      active: true
    }
  });

  // 3. Demo Users
  // Anika — Training Centre
  const userAnika = await prisma.user.upsert({
    where: { email: 'anika@skilling.gov.in' },
    update: { passwordHash },
    create: {
      name: 'Anika Sharma',
      email: 'anika@skilling.gov.in',
      passwordHash,
      role: 'TRAINING_CENTRE',
      trainingCentreId: tcNorth.id,
      districtId: distNorth.id
    }
  });

  // Dev — District Officer 1
  const userDev = await prisma.user.upsert({
    where: { email: 'dev@district.gov.in' },
    update: { passwordHash },
    create: {
      name: 'Dev Malhotra',
      email: 'dev@district.gov.in',
      passwordHash,
      role: 'DISTRICT_OFFICER',
      districtId: distNorth.id
    }
  });

  // Meera — District Officer 2
  const userMeera = await prisma.user.upsert({
    where: { email: 'meera@district.gov.in' },
    update: { passwordHash },
    create: {
      name: 'Meera Iyer',
      email: 'meera@district.gov.in',
      passwordHash,
      role: 'DISTRICT_OFFICER',
      districtId: distNorth.id
    }
  });

  // Kabir — District Officer 3
  const userKabir = await prisma.user.upsert({
    where: { email: 'kabir@district.gov.in' },
    update: { passwordHash },
    create: {
      name: 'Kabir Sengupta',
      email: 'kabir@district.gov.in',
      passwordHash,
      role: 'DISTRICT_OFFICER',
      districtId: distCentral.id
    }
  });

  // Neha — Quality Team
  const userNeha = await prisma.user.upsert({
    where: { email: 'neha@quality.gov.in' },
    update: { passwordHash },
    create: {
      name: 'Neha Kapoor',
      email: 'neha@quality.gov.in',
      passwordHash,
      role: 'QUALITY_TEAM'
    }
  });

  // Farah — State Office
  const userFarah = await prisma.user.upsert({
    where: { email: 'farah@state.gov.in' },
    update: { passwordHash },
    create: {
      name: 'Farah Siddiqui',
      email: 'farah@state.gov.in',
      passwordHash,
      role: 'STATE_OFFICE'
    }
  });

  console.log('[Seed] Users seeded successfully: Anika, Dev, Meera, Kabir, Neha, Farah.');

  // Helper to generate candidate batch
  const createCandidateList = async (batchId: string, count: number, startIdx: number, prefix: string) => {
    const list = [];
    for (let i = 1; i <= count; i++) {
      const idx = startIdx + i;
      const phone = `98765${String(idx).padStart(5, '0')}`;
      const candidateIdentifier = `CAND-${prefix}-${String(idx).padStart(4, '0')}`;
      const name = `${prefix} Candidate ${i}`;

      const cand = await prisma.candidate.upsert({
        where: { candidateIdentifier },
        update: {},
        create: {
          candidateIdentifier,
          fullName: name,
          phone,
          email: `${prefix.toLowerCase()}${i}@example.com`
        }
      });

      const marks = 60 + (i % 35);
      const result = marks >= 40 ? 'PASS' : 'FAIL';

      await prisma.batchCandidate.upsert({
        where: {
          batchId_candidateId: {
            batchId,
            candidateId: cand.id
          }
        },
        update: {},
        create: {
          batchId,
          candidateId: cand.id,
          marks,
          result,
          status: 'VALIDATED',
          rawRowNumber: i + 1
        }
      });
      list.push(cand);
    }
    return list;
  };

  // ==========================================
  // SCENARIO 1: Small batch with 10 candidates (DRAFT)
  // ==========================================
  const batch1 = await prisma.batch.upsert({
    where: { batchNumber: 'BATCH-2026-0001' },
    update: {},
    create: {
      batchNumber: 'BATCH-2026-0001',
      title: 'Solar PV Rooftop Technician Batch 1',
      courseName: 'Certified Solar PV Installer',
      courseCode: 'SOL-201',
      trainingCentreId: tcNorth.id,
      districtId: distNorth.id,
      startDate: new Date('2026-01-10'),
      completionDate: new Date('2026-02-15'),
      candidateCount: 10,
      status: 'DRAFT',
      currentRevision: 1
    }
  });
  await createCandidateList(batch1.id, 10, 100, 'SOL1');

  // ==========================================
  // SCENARIO 2: Large batch with 60 candidates (DRAFT / ready for submit)
  // ==========================================
  const batch2 = await prisma.batch.upsert({
    where: { batchNumber: 'BATCH-2026-0002' },
    update: {},
    create: {
      batchNumber: 'BATCH-2026-0002',
      title: 'Advanced Industrial Electrician Super-Cohort',
      courseName: 'Industrial Electrical Systems & Automation',
      courseCode: 'ELEC-401',
      trainingCentreId: tcNorth.id,
      districtId: distNorth.id,
      startDate: new Date('2025-11-01'),
      completionDate: new Date('2026-01-30'),
      candidateCount: 60,
      status: 'SUBMITTED',
      currentRevision: 1
    }
  });
  await createCandidateList(batch2.id, 60, 200, 'ELEC');

  // ==========================================
  // SCENARIO 4: Awaiting District Approvals (0/2 approved)
  // ==========================================
  const batch4 = await prisma.batch.upsert({
    where: { batchNumber: 'BATCH-2026-0004' },
    update: {},
    create: {
      batchNumber: 'BATCH-2026-0004',
      title: 'CNC Machining & Precision Engineering Cohort',
      courseName: 'CNC Milling & Turning Operations',
      courseCode: 'MECH-301',
      trainingCentreId: tcNorth.id,
      districtId: distNorth.id,
      startDate: new Date('2025-12-01'),
      completionDate: new Date('2026-01-20'),
      candidateCount: 15,
      status: 'DISTRICT_REVIEW',
      currentRevision: 1
    }
  });
  await createCandidateList(batch4.id, 15, 400, 'CNC');

  // ==========================================
  // SCENARIO 5: Awaiting 2nd District Approval (1/2 approved by Dev)
  // ==========================================
  const batch5 = await prisma.batch.upsert({
    where: { batchNumber: 'BATCH-2026-0005' },
    update: {},
    create: {
      batchNumber: 'BATCH-2026-0005',
      title: 'Automotive Diagnostic Specialist Batch A',
      courseName: 'EV Powertrain & Diagnostics',
      courseCode: 'AUTO-205',
      trainingCentreId: tcNorth.id,
      districtId: distNorth.id,
      startDate: new Date('2025-11-15'),
      completionDate: new Date('2026-01-10'),
      candidateCount: 20,
      status: 'DISTRICT_REVIEW',
      currentRevision: 1
    }
  });
  await createCandidateList(batch5.id, 20, 500, 'AUTO');
  await prisma.approval.upsert({
    where: {
      batchId_revision_officerId: {
        batchId: batch5.id,
        revision: 1,
        officerId: userDev.id
      }
    },
    update: {},
    create: {
      batchId: batch5.id,
      revision: 1,
      officerId: userDev.id,
      role: 'DISTRICT_OFFICER',
      decision: 'APPROVED',
      comments: 'Primary district audit verified against physical test logs.',
      isSuperseded: false
    }
  });

  // ==========================================
  // SCENARIO 6: Awaiting Quality Review (Large cohort > 50, approved by Dev & Meera)
  // ==========================================
  const batch6 = await prisma.batch.upsert({
    where: { batchNumber: 'BATCH-2026-0006' },
    update: {},
    create: {
      batchNumber: 'BATCH-2026-0006',
      title: 'Cloud Infrastructure & DevOps Technicians',
      courseName: 'Cloud & Network Support Technician',
      courseCode: 'IT-501',
      trainingCentreId: tcNorth.id,
      districtId: distNorth.id,
      startDate: new Date('2025-10-01'),
      completionDate: new Date('2026-01-15'),
      candidateCount: 55,
      status: 'QUALITY_REVIEW',
      currentRevision: 1
    }
  });
  const cands6 = await createCandidateList(batch6.id, 55, 600, 'CLD');
  // Flag one candidate for demo inspection in quality view
  if (cands6[3]) {
    await prisma.batchCandidate.update({
      where: {
        batchId_candidateId: {
          batchId: batch6.id,
          candidateId: cands6[3].id
        }
      },
      data: {
        status: 'FLAGGED',
        flagReason: 'Attendance record anomaly: 65% attendance requires verification.'
      }
    });
  }
  // Approvals from Dev & Meera
  await prisma.approval.upsert({
    where: {
      batchId_revision_officerId: {
        batchId: batch6.id,
        revision: 1,
        officerId: userDev.id
      }
    },
    update: {},
    create: {
      batchId: batch6.id,
      revision: 1,
      officerId: userDev.id,
      role: 'DISTRICT_OFFICER',
      decision: 'APPROVED',
      comments: 'Candidate assessment scores verified.',
      isSuperseded: false
    }
  });
  await prisma.approval.upsert({
    where: {
      batchId_revision_officerId: {
        batchId: batch6.id,
        revision: 1,
        officerId: userMeera.id
      }
    },
    update: {},
    create: {
      batchId: batch6.id,
      revision: 1,
      officerId: userMeera.id,
      role: 'DISTRICT_OFFICER',
      decision: 'APPROVED',
      comments: 'Senior district review cleared. Batch size > 50 forwarded for Quality Review.',
      isSuperseded: false
    }
  });

  // ==========================================
  // SCENARIO 7: Awaiting State Approval (Awaiting Farah)
  // ==========================================
  const batch7 = await prisma.batch.upsert({
    where: { batchNumber: 'BATCH-2026-0007' },
    update: {},
    create: {
      batchNumber: 'BATCH-2026-0007',
      title: 'Healthcare General Duty Assistants Cohort',
      courseName: 'Healthcare Assistant & Patient Care',
      courseCode: 'HLTH-101',
      trainingCentreId: tcNorth.id,
      districtId: distNorth.id,
      startDate: new Date('2025-11-01'),
      completionDate: new Date('2026-01-28'),
      candidateCount: 25,
      status: 'STATE_REVIEW',
      currentRevision: 1
    }
  });
  await createCandidateList(batch7.id, 25, 700, 'HLT');
  await prisma.approval.upsert({
    where: {
      batchId_revision_officerId: {
        batchId: batch7.id,
        revision: 1,
        officerId: userDev.id
      }
    },
    update: {},
    create: {
      batchId: batch7.id,
      revision: 1,
      officerId: userDev.id,
      role: 'DISTRICT_OFFICER',
      decision: 'APPROVED',
      comments: 'Clinical practical exams verified.',
      isSuperseded: false
    }
  });
  await prisma.approval.upsert({
    where: {
      batchId_revision_officerId: {
        batchId: batch7.id,
        revision: 1,
        officerId: userMeera.id
      }
    },
    update: {},
    create: {
      batchId: batch7.id,
      revision: 1,
      officerId: userMeera.id,
      role: 'DISTRICT_OFFICER',
      decision: 'APPROVED',
      comments: 'Hospital internship logs verified.',
      isSuperseded: false
    }
  });

  console.log('[Seed] All scenario cohorts and demo personas seeded successfully!');
  console.log('[Seed] Zero dummy certificates: Certificates will be generated dynamically only when the State Officer approves a batch (e.g. BATCH-2026-0007).');
}

main()
  .catch((e) => {
    console.error('[Seed Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


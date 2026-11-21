import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/db';
import * as XLSX from 'xlsx';
import { WhatsAppSimulator } from '../src/workers/whatsappSimulator';

describe('CertiFlow Master Test Suite — Critical Workflow Invariants', { timeout: 20000 }, () => {
  let anikaToken: string;
  let devToken: string;
  let meeraToken: string;
  let nehaToken: string;
  let farahToken: string;
  let tcId: string;
  let districtId: string;

  beforeAll(async () => {
    const resAnika = await request(app).post('/api/auth/demo-switch').send({ email: 'anika@skilling.gov.in' });
    anikaToken = resAnika.body.token;

    const resDev = await request(app).post('/api/auth/demo-switch').send({ email: 'dev@district.gov.in' });
    devToken = resDev.body.token;

    const resMeera = await request(app).post('/api/auth/demo-switch').send({ email: 'meera@district.gov.in' });
    meeraToken = resMeera.body.token;

    const resNeha = await request(app).post('/api/auth/demo-switch').send({ email: 'neha@quality.gov.in' });
    nehaToken = resNeha.body.token;

    const resFarah = await request(app).post('/api/auth/demo-switch').send({ email: 'farah@state.gov.in' });
    farahToken = resFarah.body.token;

    const tc = await prisma.trainingCentre.findFirst();
    tcId = tc!.id;
    districtId = tc!.districtId;
  });

  // =========================================================================
  // TEST 1: Invalid spreadsheet upload & atomic rollback
  // =========================================================================
  it('Test 1: Spreadsheet validation fails on invalid rows and saves ZERO partial data', async () => {
    const batchRes = await request(app)
      .post('/api/batches')
      .set('Authorization', `Bearer ${anikaToken}`)
      .send({
        title: 'Test Batch Invalid Spreadsheets',
        courseName: 'Solar PV Installer',
        courseCode: 'SOL-201',
        startDate: '2026-01-01',
        completionDate: '2026-02-01'
      });
    expect(batchRes.status).toBe(201);
    const testBatchId = batchRes.body.batch.id;

    const invalidData = [
      {
        'Candidate Name': 'Valid Student',
        'Phone Number': '9876543210',
        'Course Name': 'Solar PV Installer',
        'Course Code': 'SOL-201',
        'Marks': 85,
        'Result': 'PASS',
        'Training Start Date': '2026-01-01',
        'Training Completion Date': '2026-02-01',
      },
      {
        'Candidate Name': 'Corrupted Row Student',
        'Phone Number': '12345', // INVALID PHONE
        'Course Name': 'Solar PV Installer',
        'Course Code': 'SOL-201',
        'Marks': -15, // INVALID NEGATIVE MARKS
        'Result': 'PASS',
        'Training Start Date': '2026-01-01',
        'Training Completion Date': '2026-02-01',
      }
    ];

    const ws = XLSX.utils.json_to_sheet(invalidData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
    const invalidBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const uploadRes = await request(app)
      .post(`/api/batches/${testBatchId}/upload`)
      .set('Authorization', `Bearer ${anikaToken}`)
      .attach('file', invalidBuffer, 'invalid_candidates.xlsx');

    expect(uploadRes.status).toBe(400);
    expect(uploadRes.body.success).toBe(false);
    expect(uploadRes.body.errors.length).toBeGreaterThan(0);

    const checkBatch = await prisma.batch.findUnique({
      where: { id: testBatchId },
      include: { candidates: true }
    });
    expect(checkBatch?.candidates.length).toBe(0);

    const submitRes = await request(app)
      .post(`/api/batches/${testBatchId}/submit`)
      .set('Authorization', `Bearer ${anikaToken}`);
    expect(submitRes.status).toBe(400);
    expect(submitRes.body.error).toContain('zero candidate records');
  });

  // =========================================================================
  // TEST 2: Duplicate district approval by same officer blocked
  // =========================================================================
  it('Test 2: Same officer cannot approve the same batch revision twice', async () => {
    // Create dedicated fixture batch in DISTRICT_REVIEW
    const testBatch = await prisma.batch.create({
      data: {
        batchNumber: `BATCH-TEST-DUP-${Date.now()}`,
        title: 'Duplicate Approval Test',
        courseName: 'Solar PV Installer',
        courseCode: 'SOL-201',
        trainingCentreId: tcId,
        districtId: districtId,
        startDate: new Date(),
        completionDate: new Date(),
        status: 'DISTRICT_REVIEW',
        currentRevision: 1
      }
    });

    // 1. Dev approves once
    const firstRes = await request(app)
      .post(`/api/batches/${testBatch.id}/approve`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ comments: 'Primary approval.' });
    expect(firstRes.status).toBe(200);

    // 2. Dev attempts to approve the exact same batch revision again
    const secondRes = await request(app)
      .post(`/api/batches/${testBatch.id}/approve`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ comments: 'Attempting duplicate approval.' });

    // Expected: 400 Rejected
    expect(secondRes.status).toBe(400);
    expect(secondRes.body.error).toContain('already approved');
  });

  // =========================================================================
  // TEST 3: Concurrent / distinct approvals advance workflow only once
  // =========================================================================
  it('Test 3: Second distinct officer approval advances batch to next review stage', async () => {
    const testBatch = await prisma.batch.create({
      data: {
        batchNumber: `BATCH-TEST-CONCUR-${Date.now()}`,
        title: 'Concurrent Approval Test',
        courseName: 'Solar PV Installer',
        courseCode: 'SOL-201',
        trainingCentreId: tcId,
        districtId: districtId,
        startDate: new Date(),
        completionDate: new Date(),
        candidateCount: 15,
        status: 'DISTRICT_REVIEW',
        currentRevision: 1
      }
    });

    // Dev approves (1/2)
    const devRes = await request(app)
      .post(`/api/batches/${testBatch.id}/approve`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ comments: 'First officer approval.' });
    expect(devRes.status).toBe(200);
    expect(devRes.body.approvalsCount).toBe(1);

    // Meera (distinct 2nd officer) approves (2/2)
    const meeraRes = await request(app)
      .post(`/api/batches/${testBatch.id}/approve`)
      .set('Authorization', `Bearer ${meeraToken}`)
      .send({ comments: 'Second distinct officer approval.' });

    expect(meeraRes.status).toBe(200);
    expect(meeraRes.body.success).toBe(true);
    expect(meeraRes.body.approvalsCount).toBe(2);
    expect(meeraRes.body.nextStage).toBe('STATE_REVIEW');

    const updated = await prisma.batch.findUnique({ where: { id: testBatch.id } });
    expect(updated?.status).toBe('STATE_REVIEW');
  });

  // =========================================================================
  // TEST 4: Certificate issuance creates 1 cert per passing candidate
  // =========================================================================
  it('Test 4: State approval triggers certificate generation for all passing candidates', async () => {
    const testBatch = await prisma.batch.create({
      data: {
        batchNumber: `BATCH-TEST-STATE-${Date.now()}`,
        title: 'State Approval Cert Generation Test',
        courseName: 'Solar PV Installer',
        courseCode: 'SOL-201',
        trainingCentreId: tcId,
        districtId: districtId,
        startDate: new Date(),
        completionDate: new Date(),
        candidateCount: 3,
        status: 'STATE_REVIEW',
        currentRevision: 1
      }
    });

    // Create 3 passing candidates for this batch
    for (let i = 1; i <= 3; i++) {
      const cand = await prisma.candidate.create({
        data: {
          candidateIdentifier: `CAND-T4-${Date.now()}-${i}`,
          fullName: `Candidate TestFour ${i}`,
          phone: `987654320${i}`
        }
      });

      await prisma.batchCandidate.create({
        data: {
          batchId: testBatch.id,
          candidateId: cand.id,
          marks: 85,
          result: 'PASS',
          status: 'VALIDATED'
        }
      });
    }

    // Farah gives final state approval
    const finalRes = await request(app)
      .post(`/api/state/batches/${testBatch.id}/final-approve`)
      .set('Authorization', `Bearer ${farahToken}`)
      .send({ comments: 'State final authorization conferred.' });

    expect(finalRes.status).toBe(200);
    expect(finalRes.body.success).toBe(true);

    // Wait for background worker to process PDF generation and QR codes
    let certs: any[] = [];
    for (let i = 0; i < 20; i++) {
      await new Promise((res) => setTimeout(res, 200));
      certs = await prisma.certificate.findMany({
        where: { batchId: testBatch.id }
      });
      if (certs.length >= 3) break;
    }

    expect(certs.length).toBe(3);

    // Verify all certificate numbers are unique
    const certNumbers = new Set(certs.map((c) => c.certificateNumber));
    expect(certNumbers.size).toBe(3);
  });

  // =========================================================================
  // TEST 5: WhatsApp Simulator handles failures & retry backoff
  // =========================================================================
  it('Test 5: WhatsApp delivery simulator handles failure and retry mechanism', async () => {
    const permResult = await WhatsAppSimulator.sendMessage('9876500000', 'Test', 'url', 1);
    expect(permResult.success).toBe(false);
    expect(permResult.failureType).toBe('PERMANENT');

    const tempResult1 = await WhatsAppSimulator.sendMessage('9876501111', 'Test', 'url', 1);
    expect(tempResult1.success).toBe(false);
    expect(tempResult1.failureType).toBe('TEMPORARY');

    const tempResult2 = await WhatsAppSimulator.sendMessage('9876501111', 'Test', 'url', 2);
    expect(tempResult2.success).toBe(true);
    expect(tempResult2.failureType).toBe('NONE');
  });

  // =========================================================================
  // TEST 6: Certificate revocation & Public verification reflects CANCELLED
  // =========================================================================
  it('Test 6: Revoked certificate cannot be shown as valid on public verification', async () => {
    const cand = await prisma.candidate.create({
      data: {
        candidateIdentifier: `CAND-REV-${Date.now()}`,
        fullName: 'Test Revoke Candidate',
        phone: '9876543299'
      }
    });
    const testBatch = await prisma.batch.create({
      data: {
        batchNumber: `BATCH-TEST-REVOKE-${Date.now()}`,
        title: 'Revoke Test Cohort',
        courseName: 'Test Course',
        courseCode: 'TST-101',
        trainingCentreId: tcId,
        districtId: districtId,
        startDate: new Date(),
        completionDate: new Date(),
        candidateCount: 1,
        status: 'ISSUED',
        currentRevision: 1
      }
    });
    const certNum = `CERT-REVOKE-${Date.now()}`;
    await prisma.certificate.create({
      data: {
        certificateNumber: certNum,
        batchId: testBatch.id,
        candidateId: cand.id,
        candidateNameSnapshot: cand.fullName,
        courseNameSnapshot: testBatch.courseName,
        trainingCentreSnapshot: 'Test TC',
        completionDate: new Date(),
        issueDate: new Date(),
        status: 'CANCELLED',
        cancellationReason: 'State Vigilance Inquiry: Fraudulent record.',
        certificateHash: 'hash-test',
        pdfUrl: '/uploads/certificates/test.pdf',
        qrCodeDataUrl: 'data:image/png;base64,demo'
      }
    });

    const verifyRes = await request(app).get(`/api/verify/${certNum}`);

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.status).toBe('CANCELLED');
    expect(verifyRes.body.isValid).toBe(false);
    expect(verifyRes.body.certificate.cancellationReason).toBeDefined();

    const fakeRes = await request(app).get('/api/verify/CERT-9999-999999');
    expect(fakeRes.status).toBe(404);
    expect(fakeRes.body.status).toBe('NOT_FOUND');
    expect(fakeRes.body.isValid).toBe(false);
  });

  // =========================================================================
  // TEST 7: Return batch increments revision and invalidates prior approvals
  // =========================================================================
  it('Test 7: Returning a batch increments revision and invalidates prior approvals', async () => {
    const testBatch = await prisma.batch.create({
      data: {
        batchNumber: `BATCH-TEST-REV-${Date.now()}`,
        title: 'Revision Invalidation Test',
        courseName: 'Welding Technology',
        courseCode: 'WELD-101',
        trainingCentreId: tcId,
        districtId: districtId,
        startDate: new Date(),
        completionDate: new Date(),
        status: 'DISTRICT_REVIEW',
        currentRevision: 1
      }
    });

    const initialOfficer = await prisma.user.findFirst({ where: { role: 'DISTRICT_OFFICER' } });

    await prisma.approval.create({
      data: {
        batchId: testBatch.id,
        revision: 1,
        officerId: initialOfficer!.id,
        role: 'DISTRICT_OFFICER',
        decision: 'APPROVED',
        comments: 'Approval before return.',
        isSuperseded: false
      }
    });

    const returnRes = await request(app)
      .post(`/api/batches/${testBatch.id}/return`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ reason: 'Discrepancy in assessment date logs.' });

    expect(returnRes.status).toBe(200);
    expect(returnRes.body.batch.status).toBe('RETURNED');
    expect(returnRes.body.batch.currentRevision).toBe(2);

    const oldApprovals = await prisma.approval.findMany({
      where: { batchId: testBatch.id, revision: 1 }
    });
    expect(oldApprovals.every((a) => a.isSuperseded)).toBe(true);
  });

  // =========================================================================
  // TEST 8: Role-based authorization enforcement
  // =========================================================================
  it('Test 8: Unauthorized roles are rejected by backend RBAC middleware', async () => {
    const batch = await prisma.batch.findFirst();

    const tcApproveRes = await request(app)
      .post(`/api/batches/${batch!.id}/approve`)
      .set('Authorization', `Bearer ${anikaToken}`)
      .send({ comments: 'Self approval attempt.' });
    expect(tcApproveRes.status).toBe(403);

    const doStateApproveRes = await request(app)
      .post(`/api/state/batches/${batch!.id}/final-approve`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ comments: 'District officer attempting state approval.' });
    expect(doStateApproveRes.status).toBe(403);

    const unauthRes = await request(app).post(`/api/batches/${batch!.id}/approve`).send({});
    expect(unauthRes.status).toBe(401);
  });
});

# CertiFlow — Local Setup & Execution Guide

This document provides step-by-step instructions to run, test, and demonstrate **CertiFlow** locally.

---

## Prerequisites
- **Node.js**: v20.x or v24.x
- **npm** or **pnpm**
- **Docker & Docker Compose** (Optional for containerized mode)

---

## Step 1: Environment Configuration

The repository includes pre-configured environment templates. Create your local `.env` files if not already present:

### Root `.env`
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="certiflow_dev_jwt_secret_key_2026_top_secret"
PUBLIC_BASE_URL="http://localhost:3000"
QUALITY_REVIEW_THRESHOLD=50
STORAGE_DIR="./uploads"
DEMO_MODE=true
```

### Backend `.env` (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="certiflow_dev_jwt_secret_key_2026_top_secret"
PUBLIC_BASE_URL="http://localhost:3000"
QUALITY_REVIEW_THRESHOLD=50
STORAGE_DIR="./uploads"
DEMO_MODE=true
```

---

## Step 2: Database Setup & Demo Data Seeding

Run the database setup script to generate the Prisma client, synchronize the schema, and seed all 6 demo personas and 10 scenario batches:

```bash
cd backend
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
```

Output should confirm:
```
✔ Generated Prisma Client
Your database is now in sync with your Prisma schema.
[Seed] Users seeded successfully: Anika, Dev, Meera, Kabir, Neha, Farah.
[Seed] All 10 scenario batches and certificates seeded successfully!
```

---

## Step 3: Run Automated Test Suite

Run the full Vitest integration suite:

```bash
cd backend
npm test
```

All 8 critical workflow invariant tests will run and pass:
1. Invalid spreadsheet rejected with atomic rollback (zero partial rows).
2. Duplicate approvals by same officer blocked.
3. Concurrent distinct officer approvals advance workflow cleanly.
4. Certificate issuance creates 1 cert per candidate.
5. WhatsApp simulator exponential backoff (2s, 4s, 8s) & retry.
6. Public verification of cancelled certificate shows VOID.
7. Returned batch increments revision & invalidates prior approvals.
8. Unauthorized role access rejected (403 Forbidden).

---

## Step 4: Start the Applications

### 1. Start the Backend API & Background Workers
In Terminal 1:
```bash
cd backend
npm run dev
```
Backend starts on **http://localhost:5000**.

### 2. Start the Frontend Application
In Terminal 2:
```bash
cd frontend
npm run dev
```
Frontend runs on **http://localhost:3000**.

---

## Step 5: Guided Verification Walkthrough

1. Open **[http://localhost:3000](http://localhost:3000)** in your browser.
2. Click **Anika (TC)** in the top banner. Notice you are logged in as Training Centre Lead:
   - Navigate to **Batches Directory**.
   - Inspect `BATCH-2026-0001` (Small batch, 10 candidates).
   - Click **Submit for District Review**. Status updates to `DISTRICT_REVIEW`.
3. Switch persona to **Dev (District Officer 1)**:
   - Go to `BATCH-2026-0001`.
   - Click **Approve Batch (Officer 1/2)**.
   - Status remains `DISTRICT_REVIEW` with badge "1/2 Approved".
   - Notice Dev cannot approve again (duplicate approval guard).
4. Switch persona to **Meera (District Officer 2)**:
   - Go to `BATCH-2026-0001`.
   - Click **Approve Batch (Officer 2/2)**.
   - Distinct 2nd officer threshold met! Batch automatically transitions to `STATE_REVIEW` (cohort <= 50).
5. Switch persona to **Farah (State Office)**:
   - Go to `BATCH-2026-0001`.
   - Click **Provide Final State Approval & Issue**.
   - Background worker generates Vector PDF certificates with dynamic QR codes!
   - Batch transitions to `ISSUED`.
6. Public Verification Demonstration:
   - Click **Public Verify** in the top banner.
   - Test `CERT-2026-800001`: Shows prominent **OFFICIAL CREDENTIAL VERIFIED** green seal with SHA-256 hash.
   - Test `CERT-2026-000099`: Shows prominent **CERTIFICATE REVOKED / CANCELLED** red banner with formal cancellation justification reason!
7. WhatsApp Simulator Console:
   - Click **WhatsApp Deliveries** in the sidebar.
   - Observe simulated message deliveries, temporary network retries, and manual retry for failed jobs.


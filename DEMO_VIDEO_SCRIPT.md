# CertiFlow — 2-Minute Demo Video Script & Screenplay

Use this step-by-step screenplay to record your **< 2-minute** demonstration video (via Loom or screen recorder, uploaded to Google Drive set to *"Anyone with the link can view"*).

---

## Video Target Duration: 1 minute 50 seconds (110s)

### Scene 1: Introduction & Problem Statement (0:00 – 0:15)
* **Visual**: Show homepage at `http://localhost:3000` with the CertiFlow logo and the top **1-Click Demo Switcher banner**.
* **Voiceover**: 
  > *"Welcome to CertiFlow, an event-driven digital platform automating the skilling certificate lifecycle for state vocational programs. CertiFlow replaces informal spreadsheets and paper credentials with an immutable audit trail, a multi-tier governance state machine, automated vector PDF generation, and public QR verification."*

---

### Scene 2: Flow 1 — Training Centre Batch Submission & Atomic Validation (0:15 – 0:35)
* **Visual**: Click **Anika (TC)** on the top bar. Open `BATCH-2026-0001`.
* **Action**:
  1. Show candidate roster with scores and results.
  2. Click **Submit for District Review**.
  3. Show badge immediately transitioning to `DISTRICT_REVIEW`.
* **Voiceover**:
  > *"As Training Centre Lead Anika, I can upload candidate spreadsheets with SheetJS atomic validation—guaranteeing zero partial rows if validation fails. Here I submit Batch 2026-0001 for district review."*

---

### Scene 3: Flow 2 — Multi-Tier Approvals & Distinct Officer Enforcement (0:35 – 1:00)
* **Visual**: Click **Dev (District Officer 1)** in the top banner.
* **Action**:
  1. Click **Approve Batch (Officer 1/2)**. Add comment: *"Scores verified against practical logs."*
  2. Notice the badge shows `1/2 Approved`. If Dev tries to click again, the system prevents duplicate approvals.
  3. Click **Meera (District Officer 2)**.
  4. Meera clicks **Approve Batch (Officer 2/2)**.
  5. The batch automatically advances to `STATE_REVIEW`!
* **Voiceover**:
  > *"A key governance rule is enforcing two distinct district officer approvals. Officer Dev approves, satisfying 1 of 2. When Senior Officer Meera provides the second distinct approval, the concurrency guard verifies both signatures and automatically advances the batch."*

---

### Scene 4: Flow 3 — Final State Authorization & Automated Background Issuance (1:00 – 1:25)
* **Visual**: Click **Farah (State Office)** in the top banner.
* **Action**:
  1. Inspect the batch.
  2. Click **Provide Final State Approval & Issue**.
  3. Status immediately transitions to `APPROVED` ➔ `ISSUED`.
  4. Navigate to **Issued Certificates** in the sidebar. Show the generated certificates with dynamic QR codes.
  5. Click the **Download** button to preview the official landscape PDF certificate with guilloche border and SHA-256 integrity hash.
* **Voiceover**:
  > *"State Officer Farah provides final approval. This asynchronously triggers our BullMQ worker to generate vector PDF certificates with dynamic QR stamps and cryptographic SHA-256 integrity hashes—preventing certificate duplication and fraud."*

---

### Scene 5: Flow 4 — Public QR Verification & Revocation (1:25 – 1:45)
* **Visual**: Click **Public Verify** on the top banner (`/verify/CERT-2026-800001`).
* **Action**:
  1. Show the green **OFFICIAL CREDENTIAL VERIFIED** seal with student name, course, and hash.
  2. Next, type or click `CERT-2026-000099` (revoked demo certificate).
  3. Show the prominent red **CERTIFICATE REVOKED / CANCELLED** notice displaying the state vigilance reason and cancellation timestamp!
* **Voiceover**:
  > *"Employers verify credentials at `/verify/:id` with zero login required. Authentic certificates show a verified green seal, while cancelled certificates immediately surface a red revocation notice with the official vigilance justification."*

---

### Scene 6: Flow 5 — Simulated WhatsApp Delivery & Automated Test Proof (1:45 – 1:50)
* **Visual**: Quick glance at the **WhatsApp Deliveries** console (showing retries with exponential backoff) and terminal showing **8/8 passing tests**.
* **Voiceover**:
  > *"CertiFlow also includes an unreliable WhatsApp simulator with exponential retry backoff, SLA escalation monitoring, and an automated test suite verifying all invariants. Thank you!"*

export type Role =
  | 'TRAINING_CENTRE'
  | 'DISTRICT_OFFICER'
  | 'QUALITY_TEAM'
  | 'STATE_OFFICE'
  | 'CANDIDATE'
  | 'ADMIN';

export type BatchStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'DISTRICT_REVIEW'
  | 'QUALITY_REVIEW'
  | 'STATE_REVIEW'
  | 'APPROVED'
  | 'ISSUING'
  | 'ISSUED'
  | 'RETURNED'
  | 'REJECTED'
  | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  districtId?: string | null;
  trainingCentreId?: string | null;
  district?: { id: string; name: string; code: string };
  trainingCentre?: { id: string; name: string; code: string };
}

export interface Candidate {
  id: string;
  candidateIdentifier: string;
  fullName: string;
  phone: string;
  email?: string;
}

export interface BatchCandidate {
  id: string;
  batchId: string;
  candidateId: string;
  candidate: Candidate;
  marks: number;
  result: 'PASS' | 'FAIL';
  status: 'PENDING' | 'VALIDATED' | 'FLAGGED' | 'APPROVED' | 'FAILED';
  flagReason?: string;
  rawRowNumber?: number;
}

export interface Approval {
  id: string;
  batchId: string;
  revision: number;
  officerId: string;
  officer: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  role: Role;
  decision: 'APPROVED' | 'REJECTED' | 'RETURNED';
  comments?: string;
  isSuperseded: boolean;
  createdAt: string;
}

export interface Batch {
  id: string;
  batchNumber: string;
  title: string;
  courseName: string;
  courseCode: string;
  trainingCentreId: string;
  trainingCentre: {
    id: string;
    name: string;
    code: string;
  };
  districtId: string;
  district: {
    id: string;
    name: string;
    code: string;
  };
  startDate: string;
  completionDate: string;
  candidateCount: number;
  status: BatchStatus;
  currentRevision: number;
  slaStageEnteredAt: string;
  isOverdue: boolean;
  rejectionReason?: string;
  returnReason?: string;
  candidates?: BatchCandidate[];
  approvals?: Approval[];
  _count?: {
    candidates: number;
    certificates: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  batchId: string;
  candidateId: string;
  candidateNameSnapshot: string;
  courseNameSnapshot: string;
  trainingCentreSnapshot: string;
  completionDate: string;
  issueDate: string;
  issuingAuthority: string;
  certificateHash: string;
  pdfUrl: string;
  qrCodeDataUrl: string;
  status: 'VALID' | 'CANCELLED';
  cancellationReason?: string;
  cancelledAt?: string;
  candidate?: Candidate;
  batch?: Batch;
  deliveryJobs?: DeliveryJob[];
}

export interface DeliveryJob {
  id: string;
  certificateId: string;
  certificate?: Certificate;
  candidateId: string;
  candidate?: Candidate;
  phone: string;
  status: 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'FAILED' | 'RETRYING';
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt?: string;
  lastError?: string;
  failureType: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: string;
  newState?: string;
  ipAddress?: string;
  metadata?: string;
  timestamp: string;
}

export interface DemoUser {
  id?: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  description: string;
  districtCode?: string;
  trainingCentreCode?: string;
}


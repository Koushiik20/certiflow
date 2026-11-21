import { prisma } from '../../db';

export interface AuditLogParams {
  userId?: string | null;
  userRole?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: any;
  newState?: any;
  ipAddress?: string | null;
  metadata?: any;
}

export async function recordAuditLog(params: AuditLogParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        userRole: params.userRole || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        previousState: params.previousState ? JSON.stringify(params.previousState) : null,
        newState: params.newState ? JSON.stringify(params.newState) : null,
        ipAddress: params.ipAddress || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      }
    });
  } catch (error) {
    console.error('[CertiFlow AuditLog Error] Failed to write audit record:', error);
    // Audit logs should never throw unhandled errors that break core flows
    return null;
  }
}


import { EventEmitter } from 'events';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../config';

export type CertiFlowEvent =
  | 'BatchSubmitted'
  | 'DistrictApprovalReceived'
  | 'QualityReviewCompleted'
  | 'BatchApproved'
  | 'CertificateGenerated'
  | 'CertificateDeliveryRequested'
  | 'CertificateDelivered'
  | 'CertificateDeliveryFailed'
  | 'CertificateCancelled';

export interface LivePulseEvent {
  id: string;
  eventType: string;
  summary: string;
  timestamp: string;
  level: 'info' | 'warn' | 'success' | 'alert';
}

class CertiFlowEventBus extends EventEmitter {
  private redisClient: Redis | null = null;
  private isRedisAvailable = false;
  private certQueue: Queue | null = null;
  private deliveryQueue: Queue | null = null;
  private pulseBuffer: LivePulseEvent[] = [
    {
      id: 'init-1',
      eventType: 'SystemBoot',
      summary: 'State Event Fabric initialized with Dual-Driver (Redis/BullMQ + EventBus)',
      timestamp: new Date(Date.now() - 45000).toISOString(),
      level: 'info'
    },
    {
      id: 'init-2',
      eventType: 'SlaSentinel',
      summary: 'SLA Escalation Sentinel active: polling intervals configured (24h/12h/24h)',
      timestamp: new Date(Date.now() - 30000).toISOString(),
      level: 'success'
    },
    {
      id: 'init-3',
      eventType: 'CryptoSealer',
      summary: 'Cryptographic SHA-256 Merkle Generator & QR Engine ready for PDF issuing',
      timestamp: new Date(Date.now() - 15000).toISOString(),
      level: 'info'
    }
  ];

  constructor() {
    super();
    this.initRedis();
  }

  private initRedis() {
    try {
      this.redisClient = new Redis(config.redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: () => null // don't infinite retry if offline
      });

      this.redisClient.on('connect', () => {
        console.log('[EventBus] Redis connected successfully. BullMQ queues initialized.');
        this.isRedisAvailable = true;
        this.certQueue = new Queue('certificate-generation', { connection: this.redisClient! });
        this.deliveryQueue = new Queue('whatsapp-delivery', { connection: this.redisClient! });
      });

      this.redisClient.on('error', (err) => {
        if (!this.isRedisAvailable) {
          // Normal fallback mode
          // console.warn('[EventBus] Redis not available, using in-memory event fallback.');
        }
      });
    } catch (e) {
      this.isRedisAvailable = false;
    }
  }

  public async publish(event: CertiFlowEvent, payload: any): Promise<void> {
    console.log(`[EventBus] Dispatched event: ${event}`, {
      entityId: payload.batchId || payload.certificateId || payload.jobId,
      timestamp: new Date().toISOString()
    });

    // Record in pulse buffer
    let summary = `Event ${event} dispatched`;
    let level: 'info' | 'warn' | 'success' | 'alert' = 'info';

    switch (event) {
      case 'BatchSubmitted':
        summary = `Batch ${payload.batchNumber || payload.batchId} submitted for District Governance`;
        level = 'info';
        break;
      case 'DistrictApprovalReceived':
        summary = `District Endorsement recorded by Officer for Batch ${payload.batchId}`;
        level = 'success';
        break;
      case 'QualityReviewCompleted':
        summary = `Quality Team cleared cohort audit for Batch ${payload.batchId}`;
        level = 'success';
        break;
      case 'BatchApproved':
        summary = `State Final Sign-off granted! Vector PDF & QR worker dispatched`;
        level = 'success';
        break;
      case 'CertificateGenerated':
        summary = `PDF certificate sealed with SHA-256 integrity hash & QR`;
        level = 'success';
        break;
      case 'CertificateDeliveryRequested':
        summary = `WhatsApp dispatch queued with exponential backoff retry worker`;
        level = 'info';
        break;
      case 'CertificateDelivered':
        summary = `WhatsApp notification delivered successfully to candidate`;
        level = 'success';
        break;
      case 'CertificateDeliveryFailed':
        summary = `WhatsApp delivery bounced (Attempt ${payload.attempt || 1}); backoff scheduled`;
        level = 'warn';
        break;
      case 'CertificateCancelled':
        summary = `Vigilance Revocation: Certificate marked CANCELLED with audit reason`;
        level = 'alert';
        break;
    }

    this.pulseBuffer.unshift({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventType: event,
      summary,
      timestamp: new Date().toISOString(),
      level
    });

    if (this.pulseBuffer.length > 50) {
      this.pulseBuffer.pop();
    }

    // 1. Emit locally via EventEmitter
    this.emit(event, payload);

    // 2. If Redis is active and event maps to BullMQ queue
    if (this.isRedisAvailable) {
      try {
        if (event === 'BatchApproved' && this.certQueue) {
          await this.certQueue.add('generate-certificates', payload, {
            jobId: `batch-cert-${payload.batchId}`,
            removeOnComplete: 100,
            removeOnFail: 200,
          });
        } else if (event === 'CertificateDeliveryRequested' && this.deliveryQueue) {
          await this.deliveryQueue.add('send-whatsapp', payload, {
            jobId: `delivery-${payload.deliveryJobId}`,
            attempts: 4,
            backoff: {
              type: 'exponential',
              delay: 2000, // 2s, 4s, 8s
            },
            removeOnComplete: 100,
          });
        }
      } catch (err) {
        console.warn(`[EventBus] BullMQ enqueue fallback to local:`, err);
      }
    }
  }

  public getRedisStatus(): boolean {
    return this.isRedisAvailable;
  }

  public getRecentPulse(): LivePulseEvent[] {
    return this.pulseBuffer;
  }
}

export const eventBus = new CertiFlowEventBus();


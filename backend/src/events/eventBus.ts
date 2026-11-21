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

class CertiFlowEventBus extends EventEmitter {
  private redisClient: Redis | null = null;
  private isRedisAvailable = false;
  private certQueue: Queue | null = null;
  private deliveryQueue: Queue | null = null;

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
}

export const eventBus = new CertiFlowEventBus();


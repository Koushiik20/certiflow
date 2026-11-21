import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../config';
import { processBatchCertificateGeneration } from './certificateWorker';
import { processDeliveryJob } from './deliveryWorker';
import { eventBus } from '../events/eventBus';

export function startWorkers() {
  console.log('[Workers] Initializing CertiFlow background workers...');

  // 1. Wire in-memory event listeners (works universally without external services)
  eventBus.on('BatchApproved', async ({ batchId }) => {
    try {
      await processBatchCertificateGeneration(batchId);
    } catch (err) {
      console.error(`[Worker] Error processing BatchApproved for batch ${batchId}:`, err);
    }
  });

  eventBus.on('CertificateDeliveryRequested', async ({ deliveryJobId }) => {
    try {
      await processDeliveryJob(deliveryJobId);
    } catch (err) {
      console.error(`[Worker] Error processing CertificateDeliveryRequested for job ${deliveryJobId}:`, err);
    }
  });

  // 2. Wire BullMQ workers if Redis is available
  try {
    const redisConn = new Redis(config.redisUrl, {
      maxRetriesPerRequest: null,
      retryStrategy: () => null
    });

    redisConn.on('connect', () => {
      console.log('[BullMQ Workers] Connected to Redis. Initializing consumers...');

      new Worker(
        'certificate-generation',
        async (job) => {
          return await processBatchCertificateGeneration(job.data.batchId);
        },
        { connection: redisConn }
      );

      new Worker(
        'whatsapp-delivery',
        async (job) => {
          return await processDeliveryJob(job.data.deliveryJobId);
        },
        { connection: redisConn }
      );
    });

    redisConn.on('error', () => {
      // In-memory workers remain active
    });
  } catch (err) {
    console.warn('[BullMQ Workers] Using in-memory event workers.');
  }
}

// If invoked as standalone CLI worker (npm run worker)
if (require.main === module) {
  startWorkers();
}


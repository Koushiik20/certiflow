import { prisma } from '../db';
import { WhatsAppSimulator } from './whatsappSimulator';
import { eventBus } from '../events/eventBus';
import { recordAuditLog } from '../modules/audit/auditService';

export async function processDeliveryJob(deliveryJobId: string): Promise<boolean> {
  const job = await prisma.deliveryJob.findUnique({
    where: { id: deliveryJobId },
    include: {
      certificate: true,
      candidate: true
    }
  });

  if (!job) {
    console.error(`[Delivery Worker] Job ${deliveryJobId} not found.`);
    return false;
  }

  if (job.status === 'DELIVERED') {
    console.log(`[Delivery Worker] Job ${deliveryJobId} is already DELIVERED. Skipping.`);
    return true;
  }

  const nextAttempt = job.attemptCount + 1;

  await prisma.deliveryJob.update({
    where: { id: deliveryJobId },
    data: {
      status: 'PROCESSING',
      attemptCount: nextAttempt
    }
  });

  const messageText = `Congratulations ${job.candidate.fullName}! Your official Certificate of Vocational Skilling (${job.certificate.courseNameSnapshot}) has been issued. Certificate ID: ${job.certificate.certificateNumber}. Verify online at: ${job.certificate.pdfUrl}`;

  const simulation = await WhatsAppSimulator.sendMessage(
    job.phone,
    messageText,
    job.certificate.pdfUrl,
    nextAttempt
  );

  if (simulation.success) {
    await prisma.deliveryJob.update({
      where: { id: deliveryJobId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        lastError: null,
        failureType: 'NONE'
      }
    });

    await recordAuditLog({
      action: 'CERTIFICATE_DELIVERED',
      entityType: 'DELIVERY_JOB',
      entityId: deliveryJobId,
      newState: { status: 'DELIVERED', phone: job.phone, attempts: nextAttempt }
    });

    await eventBus.publish('CertificateDelivered', { deliveryJobId, certificateId: job.certificateId });
    console.log(`[Delivery Worker] WhatsApp message delivered to ${job.phone} on attempt ${nextAttempt}.`);
    return true;
  } else {
    // Delivery failed
    const isPermanent = simulation.failureType === 'PERMANENT';
    const hasExceededRetries = nextAttempt >= job.maxAttempts;

    if (isPermanent || hasExceededRetries) {
      await prisma.deliveryJob.update({
        where: { id: deliveryJobId },
        data: {
          status: 'FAILED',
          lastError: simulation.errorDetails,
          failureType: simulation.failureType,
          nextRetryAt: null
        }
      });

      await recordAuditLog({
        action: 'CERTIFICATE_DELIVERY_FAILED',
        entityType: 'DELIVERY_JOB',
        entityId: deliveryJobId,
        newState: { status: 'FAILED', error: simulation.errorDetails, failureType: simulation.failureType }
      });

      await eventBus.publish('CertificateDeliveryFailed', {
        deliveryJobId,
        error: simulation.errorDetails,
        permanent: isPermanent
      });

      console.warn(`[Delivery Worker] WhatsApp delivery definitively FAILED for ${job.phone}: ${simulation.errorDetails}`);
      return false;
    } else {
      // Exponential backoff: 2s, 4s, 8s...
      const backoffDelaySeconds = Math.pow(2, nextAttempt);
      const nextRetryDate = new Date(Date.now() + backoffDelaySeconds * 1000);

      await prisma.deliveryJob.update({
        where: { id: deliveryJobId },
        data: {
          status: 'RETRYING',
          lastError: simulation.errorDetails,
          failureType: simulation.failureType,
          nextRetryAt: nextRetryDate
        }
      });

      console.log(`[Delivery Worker] Temporary failure for ${job.phone}. Retrying in ${backoffDelaySeconds}s (at ${nextRetryDate.toISOString()})...`);

      // Trigger asynchronous retry for local/in-memory environments if Redis worker isn't active
      if (!eventBus.getRedisStatus()) {
        setTimeout(async () => {
          try {
            await processDeliveryJob(deliveryJobId);
          } catch (err) {
            console.error(`[Delivery Worker] Scheduled retry error:`, err);
          }
        }, backoffDelaySeconds * 1000);
      }

      return false;
    }
  }
}


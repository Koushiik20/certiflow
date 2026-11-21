import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { connectDB } from './db';
import { errorHandler } from './middleware/errorHandler';
import { startWorkers } from './workers';
import { eventBus } from './events/eventBus';

// Route Handlers
import authRoutes from './modules/auth/authRoutes';
import batchRoutes from './modules/batches/batchRoutes';
import approvalRoutes from './modules/approvals/approvalRoutes';
import qualityRoutes from './modules/quality/qualityRoutes';
import stateRoutes from './modules/state/stateRoutes';
import certificateRoutes from './modules/certificates/certificateRoutes';
import verificationRoutes from './modules/verification/verificationRoutes';
import deliveryRoutes from './modules/delivery/deliveryRoutes';
import auditRoutes from './modules/audit/auditRoutes';
import slaRoutes from './modules/sla/slaRoutes';

const app = express();

// Ensure upload/certificate storage directories exist
const certStorageDir = path.join(config.storageDir, 'certificates');
if (!fs.existsSync(certStorageDir)) {
  fs.mkdirSync(certStorageDir, { recursive: true });
}

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve certificate uploads statically
app.use('/uploads', express.static(config.storageDir));

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'certiflow-api',
    demoMode: config.demoMode
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/batches', approvalRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/state', stateRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/verify', verificationRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/sla', slaRoutes);

// Error Handler
app.use(errorHandler);

// Always initialize background worker listeners
startWorkers();

// Start server
async function main() {
  await connectDB();

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`===================================================`);
    console.log(`🚀 CertiFlow Backend API running on port ${config.port}`);
    console.log(`📡 Public Base URL: ${config.publicBaseUrl}`);
    console.log(`🔒 Quality Review Threshold: >${config.qualityReviewThreshold} candidates`);
    console.log(`💾 Storage Directory: ${config.storageDir}`);
    console.log(`===================================================`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  main();
}

export default app;

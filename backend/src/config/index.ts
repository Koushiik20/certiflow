import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'certiflow_default_jwt_secret_dev_key',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:3000',
  qualityReviewThreshold: parseInt(process.env.QUALITY_REVIEW_THRESHOLD || '50', 10),
  storageDir: path.resolve(process.env.STORAGE_DIR || './uploads'),
  demoMode: process.env.DEMO_MODE !== 'false',
  slaHours: {
    SUBMITTED: 12,
    DISTRICT_REVIEW: 24,
    QUALITY_REVIEW: 12,
    STATE_REVIEW: 24,
  }
};


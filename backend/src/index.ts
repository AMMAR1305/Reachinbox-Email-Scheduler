import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { validateEnv } from './config/env';
import authRoutes from './routes/authRoutes';
import emailRoutes from './routes/emailRoutes';
import slackRoutes from './routes/slackRoutes';
import healthRoutes from './routes/healthRoutes';
import { globalErrorHandler } from './middleware/errorHandler';
import { initElasticsearch } from './services/elasticsearchService';
import { startEmailWorker } from './workers/emailWorker';

// 1. Validate Environment Variables at Startup
const env = validateEnv();

const app = express();

// 2. Security & Middleware Configuration
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { emailQueue } from './queues/emailQueue';

// BullMQ Visual Admin Dashboard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter: serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// 3. API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/slack', slackRoutes);
app.use('/api', healthRoutes);

// 4. Global Error Handler
app.use(globalErrorHandler);

// 5. Initialize Background Worker & Infrastructure Services
async function bootstrap() {
  console.log('[Server] Initializing infrastructure connections...');
  
  // Try initializing Elasticsearch index if service is available
  await initElasticsearch();

  // Start BullMQ Background Email Worker
  startEmailWorker();

  app.listen(env.PORT, () => {
    console.log('==================================================');
    console.log(`🚀 ReachInbox Backend API running on port ${env.PORT}`);
    console.log(`🌐 Environment: ${env.NODE_ENV}`);
    console.log(`🔗 Frontend Allowed Origin: ${env.FRONTEND_URL}`);
    console.log('==================================================');
  });
}

bootstrap().catch((err) => {
  console.error('[Server] Fatal startup failure:', err);
  process.exit(1);
});

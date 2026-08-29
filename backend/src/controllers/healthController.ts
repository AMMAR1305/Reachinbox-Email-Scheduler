import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { redisConnection } from '../services/redisService';
import { esClient } from '../services/elasticsearchService';
import { emailQueue } from '../queues/emailQueue';

export async function getHealthStatus(req: Request, res: Response) {
  const health: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      postgres: 'unknown',
      redis: 'unknown',
      elasticsearch: 'unknown',
    },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.services.postgres = 'healthy';
  } catch (err: any) {
    health.services.postgres = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    const ping = await redisConnection.ping();
    health.services.redis = ping === 'PONG' ? 'healthy' : 'unhealthy';
  } catch (err: any) {
    health.services.redis = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    const esHealth = await esClient.cluster.health({});
    health.services.elasticsearch = esHealth.status || 'healthy';
  } catch (err: any) {
    health.services.elasticsearch = 'unhealthy';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  return res.status(statusCode).json(health);
}

export async function getQueueStats(req: Request, res: Response) {
  try {
    const counts = await emailQueue.getJobCounts(
      'active',
      'delayed',
      'waiting',
      'completed',
      'failed'
    );

    return res.json({
      queue: 'email-scheduler-queue',
      counts,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Queue Stats Error', message: error.message });
  }
}

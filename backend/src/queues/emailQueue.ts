import { Queue } from 'bullmq';
import { redisConnection } from '../services/redisService';

export const EMAIL_QUEUE_NAME = 'email-scheduler-queue';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
});

export async function enqueueEmailJob(
  emailJobId: string,
  delayMs: number
): Promise<string> {
  const job = await emailQueue.add(
    'send-email',
    { emailJobId },
    {
      delay: Math.max(0, delayMs),
      jobId: `email-${emailJobId}-${Date.now()}`,
    }
  );

  console.log(
    `[BullMQ] Enqueued email job '${emailJobId}' with delay ${delayMs}ms. BullJobId: ${job.id}`
  );

  return job.id!;
}

export async function removeEmailJob(bullJobId: string): Promise<boolean> {
  try {
    const job = await emailQueue.getJob(bullJobId);
    if (job) {
      await job.remove();
      console.log(`[BullMQ] Job '${bullJobId}' successfully removed from queue.`);
      return true;
    }
    return false;
  } catch (error: any) {
    console.error(`[BullMQ] Failed to remove job '${bullJobId}':`, error.message);
    return false;
  }
}

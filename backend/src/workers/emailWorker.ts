import { Worker, Job } from 'bullmq';
import { EMAIL_QUEUE_NAME, enqueueEmailJob } from '../queues/emailQueue';
import { redisConnection, checkAndIncrementRateLimit } from '../services/redisService';
import { prisma } from '../db/prisma';
import { sendEmailViaEthereal } from '../services/etherealService';
import { indexSentEmail } from '../services/elasticsearchService';
import { sendSlackNotification } from '../services/slackService';

export function startEmailWorker() {
  console.log('[Worker] Starting Email Processing Worker...');

  const worker = new Worker(
    EMAIL_QUEUE_NAME,
    async (job: Job<{ emailJobId: string }>) => {
      const { emailJobId } = job.data;
      console.log(`[Worker] Processing job '${job.id}' for EmailJob ID '${emailJobId}'...`);

      // 1. Fetch EmailJob from PostgreSQL
      const emailJob = await prisma.emailJob.findUnique({
        where: { id: emailJobId },
        include: { user: true },
      });

      if (!emailJob) {
        console.warn(`[Worker] EmailJob '${emailJobId}' not found in database. Skipping.`);
        return;
      }

      // Idempotency check: Ignore cancelled or already sent jobs
      if (emailJob.status === 'CANCELLED' || emailJob.status === 'SENT') {
        console.log(`[Worker] EmailJob '${emailJobId}' status is '${emailJob.status}'. Skipping execution.`);
        return;
      }

      // 2. Check Atomic Hourly Rate Limit in Redis
      const rateLimitCheck = await checkAndIncrementRateLimit(
        emailJob.userId,
        emailJob.hourlyLimit
      );

      if (!rateLimitCheck.allowed) {
        console.warn(
          `[Worker] User ${emailJob.userId} rate limit exceeded (${rateLimitCheck.currentCount}/${emailJob.hourlyLimit}). Rescheduling job in ${rateLimitCheck.ttlSeconds}s.`
        );

        // Update DB status to RESCHEDULED
        await prisma.emailJob.update({
          where: { id: emailJobId },
          data: { status: 'RESCHEDULED' },
        });

        // Re-enqueue job for next hour
        const newBullJobId = await enqueueEmailJob(
          emailJobId,
          rateLimitCheck.ttlSeconds * 1000
        );

        await prisma.emailJob.update({
          where: { id: emailJobId },
          data: { bullJobId: newBullJobId },
        });

        // Send Slack Notification for rate limit hit
        await sendSlackNotification(
          emailJob.userId,
          `⚠️ *Rate Limit Exceeded*: Email job to *${emailJob.recipients.join(
            ', '
          )}* has reached the hourly limit of ${emailJob.hourlyLimit} emails/hr. Rescheduled in ${Math.ceil(
            rateLimitCheck.ttlSeconds / 60
          )} minutes.`
        );

        return;
      }

      // 3. Mark job as PROCESSING
      await prisma.emailJob.update({
        where: { id: emailJobId },
        data: { status: 'PROCESSING' },
      });

      // 4. Send emails via Ethereal SMTP
      try {
        let lastPreviewUrl: string | null = null;
        let lastMsgId: string | null = null;

        for (const recipient of emailJob.recipients) {
          const sendResult = await sendEmailViaEthereal({
            to: recipient,
            subject: emailJob.subject,
            body: emailJob.body,
          });

          lastPreviewUrl = sendResult.previewUrl;
          lastMsgId = sendResult.messageId;

          // Create SentEmail record in PostgreSQL
          const sentEmailRecord = await prisma.sentEmail.create({
            data: {
              userId: emailJob.userId,
              emailJobId: emailJob.id,
              recipient,
              subject: emailJob.subject,
              body: emailJob.body,
              etherealMsgId: sendResult.messageId,
              previewUrl: sendResult.previewUrl,
            },
          });

          // Index in Elasticsearch
          await indexSentEmail({
            id: sentEmailRecord.id,
            userId: emailJob.userId,
            emailJobId: emailJob.id,
            recipient,
            subject: emailJob.subject,
            body: emailJob.body,
            sentAt: sentEmailRecord.sentAt,
            etherealMsgId: sendResult.messageId,
            previewUrl: sendResult.previewUrl,
          });
        }

        // Mark EmailJob as SENT
        await prisma.emailJob.update({
          where: { id: emailJobId },
          data: {
            status: 'SENT',
            sentAt: new Date(),
          },
        });

        console.log(`[Worker] Successfully sent EmailJob '${emailJobId}' to all recipients.`);
      } catch (error: any) {
        console.error(`[Worker] Send execution failed for EmailJob '${emailJobId}':`, error.message);

        // Update DB status immediately to FAILED with error message
        await prisma.emailJob.update({
          where: { id: emailJobId },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          },
        });

        await sendSlackNotification(
          emailJob.userId,
          `🚨 *Email Delivery Failure*: Job to *${emailJob.recipients.join(
            ', '
          )}* failed. Error: ${error.message}`
        );

        throw error; // Let BullMQ handle retry mechanism
      }
    },

    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed with error: ${err.message}`);
  });

  return worker;
}

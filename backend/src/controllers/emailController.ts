import { Response } from 'express';
import crypto from 'crypto';
import papaparse from 'papaparse';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { prisma } from '../db/prisma';
import { enqueueEmailJob, removeEmailJob } from '../queues/emailQueue';
import { searchSentEmails } from '../services/elasticsearchService';

export async function scheduleEmail(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { recipients, subject, body, delaySeconds, hourlyLimit, scheduledAtTime } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Validation Error', message: 'At least one recipient email is required.' });
    }

    if (!subject || !body) {
      return res.status(400).json({ error: 'Validation Error', message: 'Subject and email body are required.' });
    }

    // Clean & validate recipient email format
    const validRecipients = recipients
      .map((r: string) => r.trim().toLowerCase())
      .filter((r: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r));

    if (validRecipients.length === 0) {
      return res.status(400).json({ error: 'Validation Error', message: 'No valid recipient email addresses provided.' });
    }

    const delay = Math.max(0, parseInt(delaySeconds || '0', 10));
    const limit = Math.max(1, parseInt(hourlyLimit || '50', 10));

    let scheduledAt = new Date();
    if (scheduledAtTime) {
      scheduledAt = new Date(scheduledAtTime);
    } else if (delay > 0) {
      scheduledAt = new Date(Date.now() + delay * 1000);
    }

    // Generate Idempotency Key
    const rawKey = `${userId}:${validRecipients.sort().join(',')}:${subject}:${scheduledAt.getTime()}`;
    const idempotencyKey = crypto.createHash('sha256').update(rawKey).digest('hex');

    // Check for duplicate pending job with same idempotency key
    const existing = await prisma.emailJob.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      return res.status(200).json({
        message: 'Email job already scheduled (Idempotent call)',
        emailJob: existing,
      });
    }

    // Create EmailJob in PostgreSQL
    const emailJob = await prisma.emailJob.create({
      data: {
        userId,
        recipients: validRecipients,
        subject,
        body,
        delaySeconds: delay,
        hourlyLimit: limit,
        scheduledAt,
        status: 'PENDING',
        idempotencyKey,
      },
    });

    // Enqueue job in BullMQ
    const delayMs = Math.max(0, scheduledAt.getTime() - Date.now());
    const bullJobId = await enqueueEmailJob(emailJob.id, delayMs);

    // Update EmailJob with bullJobId
    const updatedJob = await prisma.emailJob.update({
      where: { id: emailJob.id },
      data: { bullJobId },
    });

    return res.status(201).json({
      message: 'Email scheduled successfully',
      emailJob: updatedJob,
    });
  } catch (error: any) {
    console.error('[Email Controller] scheduleEmail error:', error.message);
    return res.status(500).json({ error: 'Scheduling Failed', message: 'Failed to schedule email job.' });
  }
}

export async function getScheduledEmails(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const skip = (page - 1) * limit;

    const [total, jobs] = await Promise.all([
      prisma.emailJob.count({
        where: {
          userId,
          status: { in: ['PENDING', 'PROCESSING', 'RESCHEDULED', 'FAILED'] },
        },
      }),
      prisma.emailJob.findMany({
        where: {
          userId,
          status: { in: ['PENDING', 'PROCESSING', 'RESCHEDULED', 'FAILED'] },
        },
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limit,
      }),
    ]);

    return res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      jobs,
    });
  } catch (error: any) {
    console.error('[Email Controller] getScheduledEmails error:', error.message);
    return res.status(500).json({ error: 'Fetch Failed', message: 'Failed to retrieve scheduled emails.' });
  }
}

export async function getSentEmails(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const skip = (page - 1) * limit;

    const [total, sent] = await Promise.all([
      prisma.sentEmail.count({ where: { userId } }),
      prisma.sentEmail.findMany({
        where: { userId },
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      sent,
    });
  } catch (error: any) {
    console.error('[Email Controller] getSentEmails error:', error.message);
    return res.status(500).json({ error: 'Fetch Failed', message: 'Failed to retrieve sent emails.' });
  }
}

export async function getEmailById(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const emailJob = await prisma.emailJob.findFirst({
      where: { id, userId },
      include: { sentEmails: true },
    });

    if (!emailJob) {
      return res.status(404).json({ error: 'Not Found', message: 'Email record not found or access denied.' });
    }

    return res.json({ emailJob });
  } catch (error: any) {
    return res.status(500).json({ error: 'Fetch Failed', message: 'Failed to retrieve email details.' });
  }
}

export async function cancelScheduledEmail(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const emailJob = await prisma.emailJob.findFirst({
      where: { id, userId },
    });

    if (!emailJob) {
      return res.status(404).json({ error: 'Not Found', message: 'Scheduled email not found or access denied.' });
    }

    if (emailJob.status === 'SENT' || emailJob.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Action Failed', message: `Cannot cancel email with status '${emailJob.status}'.` });
    }

    // Remove from BullMQ queue if bullJobId exists
    if (emailJob.bullJobId) {
      await removeEmailJob(emailJob.bullJobId);
    }

    // Update status in PostgreSQL to CANCELLED
    const updated = await prisma.emailJob.update({
      where: { id: emailJob.id },
      data: { status: 'CANCELLED' },
    });

    return res.json({
      message: 'Scheduled email cancelled successfully.',
      emailJob: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Cancel Failed', message: 'Failed to cancel scheduled email.' });
  }
}

export async function searchEmails(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const query = (req.query.q as string) || '';

    const results = await searchSentEmails(userId, query);

    return res.json({
      query,
      count: results.length,
      results,
    });
  } catch (error: any) {
    console.error('[Email Controller] searchEmails error:', error.message);
    return res.status(500).json({ error: 'Search Failed', message: 'Elasticsearch search query failed.' });
  }
}

export async function parseRecipientsFile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Missing File', message: 'Please upload a CSV or TXT file.' });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    let rawText = fileContent;

    if (req.file.originalname.endsWith('.csv')) {
      const parsed = papaparse.parse(fileContent, { header: false });
      rawText = parsed.data.flat().join(' ');
    }

    // Extract emails using regex pattern
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = rawText.match(emailRegex) || [];

    // Clean & remove duplicate emails
    const uniqueEmails = Array.from(
      new Set(matches.map((email) => email.trim().toLowerCase()))
    );

    return res.json({
      filename: req.file.originalname,
      detectedCount: matches.length,
      uniqueCount: uniqueEmails.length,
      duplicatesRemoved: matches.length - uniqueEmails.length,
      recipients: uniqueEmails,
    });
  } catch (error: any) {
    console.error('[Email Controller] parseRecipientsFile error:', error.message);
    return res.status(500).json({ error: 'File Parse Failed', message: 'Failed to parse CSV/TXT file.' });
  }
}

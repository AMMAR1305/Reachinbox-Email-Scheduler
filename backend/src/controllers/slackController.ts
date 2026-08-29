import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { prisma } from '../db/prisma';
import { sendSlackNotification } from '../services/slackService';

const slackClientId = process.env.SLACK_CLIENT_ID || '';
const slackRedirectUri = process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/slack/callback';

export async function getSlackAuthUrl(req: AuthenticatedRequest, res: Response) {
  const scope = 'chat:write,chat:write.public,incoming-webhook';
  const url = `https://slack.com/oauth/v2/authorize?client_id=${slackClientId}&scope=${encodeURIComponent(
    scope
  )}&redirect_uri=${encodeURIComponent(slackRedirectUri)}&state=${req.user!.id}`;

  return res.json({ url });
}

export async function getSlackStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const slackIntegration = await prisma.slackIntegration.findUnique({
      where: { userId },
    });

    if (!slackIntegration) {
      return res.json({
        connected: false,
        integration: null,
      });
    }

    return res.json({
      connected: true,
      integration: {
        id: slackIntegration.id,
        teamName: slackIntegration.teamName,
        channelId: slackIntegration.channelId,
        hasWebhook: !!slackIntegration.webhookUrl,
        connectedAt: slackIntegration.connectedAt,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Fetch Failed', message: 'Failed to fetch Slack status.' });
  }
}

export async function saveSlackWebhook(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { webhookUrl, channelId } = req.body;

    if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/services/')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'A valid Slack incoming webhook URL is required (https://hooks.slack.com/services/...).',
      });
    }

    const integration = await prisma.slackIntegration.upsert({
      where: { userId },
      update: {
        webhookUrl,
        channelId: channelId || '#general',
      },
      create: {
        userId,
        webhookUrl,
        channelId: channelId || '#general',
      },
    });

    return res.json({
      message: 'Slack Webhook connected successfully.',
      integration,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Save Failed', message: 'Failed to save Slack webhook.' });
  }
}

export async function disconnectSlack(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;

    await prisma.slackIntegration.deleteMany({
      where: { userId },
    });

    return res.json({
      success: true,
      message: 'Slack integration disconnected.',
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Disconnect Failed', message: 'Failed to disconnect Slack.' });
  }
}

export async function sendTestSlackAlert(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    const sent = await sendSlackNotification(
      userId,
      `🚀 *ReachInbox Test Notification*: Hello ${req.user!.name}! Your Slack integration is active and connected for ${userEmail}.`
    );

    if (!sent) {
      return res.status(400).json({
        error: 'Notification Failed',
        message: 'Could not send Slack test notification. Please verify your Webhook URL or Slack connection.',
      });
    }

    return res.json({
      success: true,
      message: 'Slack test notification sent successfully!',
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Test Failed', message: 'Failed to send Slack test notification.' });
  }
}

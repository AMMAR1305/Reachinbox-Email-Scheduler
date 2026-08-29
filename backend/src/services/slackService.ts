import { WebClient } from '@slack/web-api';
import axios from 'axios';
import { prisma } from '../db/prisma';

export async function sendSlackNotification(
  userId: string,
  message: string,
  details?: Record<string, any>
): Promise<boolean> {
  try {
    const slackIntegration = await prisma.slackIntegration.findUnique({
      where: { userId },
    });

    if (!slackIntegration) {
      console.log(`[Slack] No Slack integration configured for user ${userId}`);
      return false;
    }

    // 1. Prioritize Slack Webhook URL if available
    if (slackIntegration.webhookUrl) {
      const payload = {
        text: message,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*ReachInbox Notification*\n${message}`,
            },
          },
        ],
      };

      if (details) {
        payload.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '```' + JSON.stringify(details, null, 2) + '```',
          },
        });
      }

      await axios.post(slackIntegration.webhookUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });

      console.log(`[Slack] Webhook notification sent successfully for user ${userId}`);
      return true;
    }

    // 2. Use Slack WebClient if OAuth access token is available
    if (slackIntegration.accessToken) {
      const client = new WebClient(slackIntegration.accessToken);
      const channel = slackIntegration.channelId || '#general';

      await client.chat.postMessage({
        channel,
        text: message,
      });

      console.log(`[Slack] OAuth API notification posted to channel ${channel} for user ${userId}`);
      return true;
    }

    return false;
  } catch (error: any) {
    console.error(`[Slack] Failed to send Slack notification for user ${userId}:`, error.message);
    // Non-blocking: Slack failure should never break email scheduler flow
    return false;
  }
}

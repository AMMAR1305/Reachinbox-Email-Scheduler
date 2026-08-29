export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: string;
}

export type EmailJobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SENT'
  | 'FAILED'
  | 'CANCELLED'
  | 'RESCHEDULED';

export interface EmailJob {
  id: string;
  userId: string;
  senderAccountId?: string | null;
  recipients: string[];
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt?: string | null;
  delaySeconds: number;
  hourlyLimit: number;
  status: EmailJobStatus;
  errorMessage?: string | null;
  idempotencyKey: string;
  bullJobId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SentEmail {
  id: string;
  userId: string;
  emailJobId: string;
  recipient: string;
  subject: string;
  body: string;
  etherealMsgId?: string | null;
  previewUrl?: string | null;
  sentAt: string;
}

export interface SlackIntegration {
  id: string;
  teamName?: string | null;
  channelId?: string | null;
  hasWebhook: boolean;
  connectedAt: string;
}

export interface QueueCounts {
  active: number;
  delayed: number;
  waiting: number;
  completed: number;
  failed: number;
}

export interface HealthStatus {
  status: 'ok' | 'degraded';
  timestamp: string;
  services: {
    postgres: string;
    redis: string;
    elasticsearch: string;
  };
}

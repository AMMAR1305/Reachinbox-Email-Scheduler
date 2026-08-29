import nodemailer from 'nodemailer';

let cachedTransporter: nodemailer.Transporter | null = null;

export async function getTransporter(): Promise<nodemailer.Transporter> {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const smtpHost = process.env.SMTP_HOST || 'smtp.ethereal.email';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpUser && smtpPass) {
    cachedTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    return cachedTransporter;
  }

  // Automatically create Ethereal test account if credentials are not configured
  console.log('[Ethereal SMTP] Generating disposable test account...');
  const testAccount = await nodemailer.createTestAccount();
  console.log(`[Ethereal SMTP] Test account generated: ${testAccount.user}`);

  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return cachedTransporter;
}

export interface SendEmailParams {
  from?: string;
  to: string;
  subject: string;
  body: string;
}

export interface SendEmailResult {
  messageId: string;
  previewUrl: string | null;
}

export async function sendEmailViaEthereal(
  params: SendEmailParams
): Promise<SendEmailResult> {
  const transporter = await getTransporter();

  const defaultFrom = process.env.SMTP_USER
    ? `"ReachInbox Email Scheduler" <${process.env.SMTP_USER}>`
    : '"ReachInbox Email Scheduler" <scheduler@reachinbox.ai>';

  const mailOptions = {
    from: params.from || defaultFrom,
    to: params.to,
    subject: params.subject,
    html: params.body,
    text: params.body.replace(/<[^>]*>?/gm, ''), // Strip HTML for text alternative
  };


  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info) || null;

  console.log(`[Ethereal SMTP] Email sent to ${params.to}. MessageId: ${info.messageId}`);
  if (previewUrl) {
    console.log(`[Ethereal SMTP] Preview URL: ${previewUrl}`);
  }

  return {
    messageId: info.messageId,
    previewUrl: previewUrl ? String(previewUrl) : null,
  };
}

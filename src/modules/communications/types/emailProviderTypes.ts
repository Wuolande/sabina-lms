/**
 * Email Provider & SMTP Configuration Types
 * -----------------------------------------------------------------------
 * Supports Resend, SendGrid, Amazon SES, Postmark, Mailgun, and Custom SMTP.
 * -----------------------------------------------------------------------
 */

export type EmailProviderType = 'resend' | 'sendgrid' | 'ses' | 'postmark' | 'mailgun' | 'smtp';

export interface EmailProviderConfig {
  activeProvider: EmailProviderType;
  fromName: string; // e.g. "Sabina LMS"
  fromEmail: string; // e.g. "notifications@sabina.education"
  replyToEmail: string; // e.g. "support@sabina.education"

  // Resend API
  resendApiKey?: string;

  // SendGrid API
  sendgridApiKey?: string;

  // Amazon SES
  sesAccessKeyId?: string;
  sesSecretAccessKey?: string;
  sesRegion?: string;

  // Postmark
  postmarkServerToken?: string;

  // Mailgun
  mailgunApiKey?: string;
  mailgunDomain?: string;

  // Custom SMTP
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpSecure?: boolean; // SSL/TLS

  // Delivery & Anti-Spam Safeguards
  dailySendLimit?: number; // e.g. 5000 emails/day
  trackOpens?: boolean;
  trackClicks?: boolean;
  includeUnsubscribeHeader?: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_EMAIL_PROVIDER_CONFIG: EmailProviderConfig = {
  activeProvider: 'resend',
  fromName: 'Sabina LMS',
  fromEmail: 'notifications@sabina.education',
  replyToEmail: 'support@sabina.education',
  resendApiKey: '',
  sendgridApiKey: '',
  sesAccessKeyId: '',
  sesSecretAccessKey: '',
  sesRegion: 'us-east-1',
  postmarkServerToken: '',
  mailgunApiKey: '',
  mailgunDomain: '',
  smtpHost: 'smtp.sendgrid.net',
  smtpPort: 587,
  smtpUsername: 'apikey',
  smtpPassword: '',
  smtpSecure: false,
  dailySendLimit: 10000,
  trackOpens: true,
  trackClicks: true,
  includeUnsubscribeHeader: true,
};

export interface SendTestEmailPayload {
  recipientEmail: string;
  provider?: EmailProviderType;
  customMessage?: string;
}

export interface TestEmailResult {
  success: boolean;
  provider: EmailProviderType;
  messageId?: string;
  timestamp: string;
  logs: string[];
  error?: string;
}

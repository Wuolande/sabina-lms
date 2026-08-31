export type EmailAudience =
  | 'ALL_USERS'
  | 'ALL_STUDENTS'
  | 'ALL_TUTORS'
  | 'SINGLE_USER';

export type EmailTemplateType =
  | 'PASSWORD_RESET'
  | 'WELCOME_STUDENT'
  | 'WELCOME_TUTOR'
  | 'SECURITY_ALERT'
  | 'ACCOUNT_VERIFICATION'
  | 'BOOKING_CONFIRMATION'
  | 'LESSON_REMINDER'
  | 'PAYMENT_RECEIPT'
  | 'TUTOR_PAYOUT_PROCESSED'
  | 'ACCOUNT_SUSPENSION'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'CUSTOM';

export interface EmailTemplateDefinition {
  id: EmailTemplateType;
  name: string;
  category: 'Transactional' | 'System' | 'Marketing' | 'Security';
  defaultSubject: string;
  defaultContent: string;
  variables: string[];
  description: string;
}

export interface SendEmailPayload {
  audience: EmailAudience;
  recipientEmail?: string;
  templateType: EmailTemplateType;
  subject: string;
  content: string;
  senderName?: string;
}

export interface EmailLogRecord {
  id: string;
  audience: EmailAudience;
  recipientEmail?: string;
  recipientCount: number;
  templateType: EmailTemplateType;
  subject: string;
  contentSnippet: string;
  senderName: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'QUEUED';
  sentAt: string;
}

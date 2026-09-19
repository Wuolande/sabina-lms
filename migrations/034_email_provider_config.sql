-- ====================================================================
-- MIGRATION 034: Email Provider Configuration
-- ====================================================================
-- Adds email_provider_config JSONB column to platform_policy_settings
-- to store transactional email provider settings (Resend, SendGrid,
-- Postmark, Mailgun, AWS SES, Custom SMTP).
-- ====================================================================

-- 1. Add email_provider_config column if it doesn't already exist
ALTER TABLE public.platform_policy_settings
  ADD COLUMN IF NOT EXISTS email_provider_config JSONB NOT NULL DEFAULT '{
    "activeProvider": "resend",
    "fromName": "Sabina LMS",
    "fromEmail": "notifications@sabina.education",
    "replyToEmail": "support@sabina.education",
    "resendApiKey": "",
    "sendgridApiKey": "",
    "sesAccessKeyId": "",
    "sesSecretAccessKey": "",
    "sesRegion": "us-east-1",
    "postmarkServerToken": "",
    "mailgunApiKey": "",
    "mailgunDomain": "",
    "smtpHost": "",
    "smtpPort": 587,
    "smtpUsername": "",
    "smtpPassword": "",
    "smtpSecure": false
  }'::JSONB;

-- 2. Seed default config if 'default' row exists and has no email config
UPDATE public.platform_policy_settings
SET email_provider_config = '{
  "activeProvider": "resend",
  "fromName": "Sabina LMS",
  "fromEmail": "notifications@sabina.education",
  "replyToEmail": "support@sabina.education",
  "resendApiKey": "",
  "sendgridApiKey": "",
  "sesAccessKeyId": "",
  "sesSecretAccessKey": "",
  "sesRegion": "us-east-1",
  "postmarkServerToken": "",
  "mailgunApiKey": "",
  "mailgunDomain": "",
  "smtpHost": "",
  "smtpPort": 587,
  "smtpUsername": "",
  "smtpPassword": "",
  "smtpSecure": false
}'::JSONB
WHERE id = 'default'
  AND (email_provider_config IS NULL OR email_provider_config = '{}'::JSONB);

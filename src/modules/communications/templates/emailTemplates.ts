import { EmailTemplateDefinition } from '../types/emailTypes';

export const ENTERPRISE_EMAIL_TEMPLATES: EmailTemplateDefinition[] = [
  {
    id: 'PASSWORD_RESET',
    name: 'Password Reset & Recovery',
    category: 'Security',
    defaultSubject: '🔒 Sabina LMS: Password Reset Request',
    variables: ['{{name}}', '{{reset_link}}', '{{expiry_minutes}}', '{{support_email}}'],
    description: 'Security notification containing a 15-minute tokenized password recovery link.',
    defaultContent: `Hello {{name}},

We received a request to reset your password for your Sabina LMS account.

Click the secure button below to set a new password:
👉 {{reset_link}}

This password reset link is valid for {{expiry_minutes}} minutes and can only be used once.

⚠️ If you did not request a password reset, please disregard this email or contact security at {{support_email}} immediately. Your account remains protected.

Warm regards,
Sabina LMS Security Operations`,
  },
  {
    id: 'WELCOME_STUDENT',
    name: 'Student Welcome & Onboarding',
    category: 'Transactional',
    defaultSubject: '🚀 Welcome to Sabina LMS – Start Learning Today!',
    variables: ['{{name}}', '{{dashboard_url}}', '{{tutors_url}}'],
    description: 'Welcome email sent to newly registered students with quick links to browse tutors.',
    defaultContent: `Hello {{name}},

Welcome to Sabina LMS! We're thrilled to have you join our global community of ambitious learners.

With your new account, you can:
• Browse accredited 1-on-1 expert tutors across 16+ academic disciplines
• Schedule live trial lessons with instant HD video classroom access
• Track your syllabus milestones, attendance records, and quiz achievements

👉 Explore Verified Tutors: {{tutors_url}}
👉 Go to Your Dashboard: {{dashboard_url}}

Happy learning,
The Sabina Academic Team`,
  },
  {
    id: 'WELCOME_TUTOR',
    name: 'Tutor Approval & Welcome',
    category: 'Transactional',
    defaultSubject: '🎉 Congratulations! Your Sabina Tutor Profile is Approved',
    variables: ['{{name}}', '{{tutor_portal_url}}', '{{academy_url}}'],
    description: 'Official credential approval and onboarding guide for verified tutors.',
    defaultContent: `Dear {{name}},

Congratulations! Our academic review board has reviewed and approved your tutor credentials for Sabina LMS.

Your profile is now published in our marketplace. Here are your next steps:
1. Configure your weekly availability calendar in your Tutor Portal.
2. Complete mandatory modules in the Sabina Tutor Academy to earn certified educator badges.
3. Prepare your interactive classroom whiteboard tools.

👉 Open Tutor Portal: {{tutor_portal_url}}
👉 Access Tutor Academy: {{academy_url}}

We are proud to partner with you in delivering world-class education.

Best regards,
Sabina Educator Relations`,
  },
  {
    id: 'SECURITY_ALERT',
    name: 'Account Security Notice',
    category: 'Security',
    defaultSubject: '⚠️ Sabina LMS: Important Security Alert for Your Account',
    variables: ['{{name}}', '{{device_info}}', '{{ip_address}}', '{{timestamp}}', '{{security_settings_url}}'],
    description: 'Alert sent when a new sign-in or security modification occurs.',
    defaultContent: `Hello {{name}},

We detected a new sign-in or security change on your Sabina LMS account:

• Device / Browser: {{device_info}}
• IP Address: {{ip_address}}
• Timestamp: {{timestamp}}

If this was you, no action is required.

If you did NOT authorize this activity, please immediately secure your account by changing your password and terminating active sessions:
👉 {{security_settings_url}}

Security Team,
Sabina LMS`,
  },
  {
    id: 'ACCOUNT_VERIFICATION',
    name: 'Email Address Verification',
    category: 'Security',
    defaultSubject: '✉️ Verify Your Sabina LMS Email Address',
    variables: ['{{name}}', '{{verify_link}}', '{{code}}'],
    description: 'Email verification link and OTP code for new user onboarding.',
    defaultContent: `Hello {{name}},

Thank you for registering with Sabina LMS. Please verify your email address to complete your account activation.

Your 6-digit confirmation code is:
👉 [ {{code}} ]

Or click the direct confirmation link:
👉 {{verify_link}}

Thank you,
Sabina LMS Team`,
  },
  {
    id: 'BOOKING_CONFIRMATION',
    name: 'Lesson Booking Confirmed',
    category: 'Transactional',
    defaultSubject: '📅 Lesson Confirmed: {{subject}} with {{partner_name}}',
    variables: ['{{name}}', '{{partner_name}}', '{{subject}}', '{{lesson_time}}', '{{classroom_url}}'],
    description: 'Confirmed booking receipt sent to both student and tutor.',
    defaultContent: `Hello {{name}},

Your 1-on-1 lesson has been scheduled and confirmed!

• Subject: {{subject}}
• Instructor / Student: {{partner_name}}
• Scheduled Time: {{lesson_time}}

You can join the interactive classroom 10 minutes prior to start time:
👉 Join Classroom: {{classroom_url}}

Please ensure your microphone, camera, and internet connection are tested beforehand.

Best regards,
Sabina Classroom Coordination`,
  },
  {
    id: 'LESSON_REMINDER',
    name: 'Upcoming Lesson (1 Hour Reminder)',
    category: 'Transactional',
    defaultSubject: '⏰ Reminder: Your lesson starts in 1 hour',
    variables: ['{{name}}', '{{subject}}', '{{partner_name}}', '{{classroom_url}}'],
    description: 'Automated 1-hour countdown reminder before live session.',
    defaultContent: `Hi {{name}},

This is a quick reminder that your live 1-on-1 {{subject}} lesson with {{partner_name}} begins in 60 minutes.

👉 Enter Classroom: {{classroom_url}}

Have your notes and study materials ready. See you in class!

Sabina LMS Notifications`,
  },
  {
    id: 'PAYMENT_RECEIPT',
    name: 'Payment & Invoice Settlement',
    category: 'Transactional',
    defaultSubject: '🧾 Payment Receipt – Invoice #{{invoice_number}}',
    variables: ['{{name}}', '{{invoice_number}}', '{{amount}}', '{{date}}', '{{receipt_url}}'],
    description: 'Official tax invoice receipt for student lesson payments.',
    defaultContent: `Hello {{name}},

Thank you for your payment. Your booking transaction has been settled successfully.

• Invoice Number: {{invoice_number}}
• Amount Settled: {{amount}}
• Date: {{date}}

👉 View and download your full PDF invoice: {{receipt_url}}

Thank you for choosing Sabina LMS.

Accounting Department,
Sabina LMS Global Operations`,
  },
  {
    id: 'TUTOR_PAYOUT_PROCESSED',
    name: 'Tutor Payout Disbursement',
    category: 'Transactional',
    defaultSubject: '💰 Payout Disbursed: {{amount}} sent to your bank account',
    variables: ['{{name}}', '{{amount}}', '{{payout_ref}}', '{{earnings_url}}'],
    description: 'Notification sent to tutors when earnings are disbursed by admin.',
    defaultContent: `Dear {{name}},

We have processed your tutor payout for completed lessons on Sabina LMS.

• Net Disbursed Amount: {{amount}} (82% tutor earnings take-home)
• Reference Code: {{payout_ref}}
• Transfer Channel: Stripe Connected Bank Transfer

Funds typically appear in your registered bank account within 1-3 business days.

👉 Review your lifetime earnings statement: {{earnings_url}}

Thank you for your dedication to our students!

Sabina Finance Operations`,
  },
  {
    id: 'ACCOUNT_SUSPENSION',
    name: 'Account Moderation / Suspension Notice',
    category: 'System',
    defaultSubject: '🛑 Sabina LMS: Notice Regarding Your Account Status',
    variables: ['{{name}}', '{{reason}}', '{{support_email}}'],
    description: 'Administrative notification sent when an account is restricted or suspended.',
    defaultContent: `Hello {{name}},

This notice is to inform you that your Sabina LMS account has been placed under administrative restriction due to:

Reason: {{reason}}

While suspended, you will not be able to accept new bookings or access live classroom sessions.

If you believe this action was taken in error or wish to submit an appeal, please contact the moderation team at {{support_email}}.

Sincerely,
Sabina Trust & Safety Committee`,
  },
  {
    id: 'SYSTEM_ANNOUNCEMENT',
    name: 'Global System Broadcast / Maintenance',
    category: 'System',
    defaultSubject: '📢 Sabina LMS Platform Announcement',
    variables: ['{{name}}', '{{announcement_body}}', '{{action_url}}'],
    description: 'Broadcast announcement for feature launches, scheduled maintenance, or updates.',
    defaultContent: `Hello {{name}},

{{announcement_body}}

👉 Learn More: {{action_url}}

Thank you for being a valued member of the Sabina LMS community.

The Sabina Engineering & Product Team`,
  },
  {
    id: 'CUSTOM',
    name: 'Custom Email Dispatch',
    category: 'Marketing',
    defaultSubject: 'Sabina LMS Update',
    variables: ['{{name}}'],
    description: 'Freeform custom email allowing arbitrary markdown or text content.',
    defaultContent: `Hello {{name}},

[Enter your custom announcement or direct communication here]

Best regards,
Sabina LMS Operations`,
  },
];

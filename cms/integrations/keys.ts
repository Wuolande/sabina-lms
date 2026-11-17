/**
 * Every outside service the site uses, and where its keys come from. Admins enter them in
 * Settings › Integrations & keys; anything left empty falls back to the hosting settings
 * (environment variables) of the same name. Secret values are encrypted in the database.
 *
 * Only three things must stay in the hosting settings, because the site needs them before it
 * can read the database: DATABASE_URI, PAYLOAD_SECRET and the R2_* file storage keys.
 */
export type IntegrationKey = { tab: TabName; name: string; env: string; label: string; secret?: boolean; placeholder?: string; description?: string; width?: string };
export type TabName = "website" | "email" | "payments" | "video" | "text" | "push";

export const TABS: { name: TabName; label: string; intro: string }[] = [
  { name: "website", label: "Website", intro: "The address people use to reach the site. Used in emails, links, search engines and the sitemap." },
  { name: "email", label: "Email", intro: "The mail server that sends sign-up confirmations, password resets, booking emails and reminders. Most providers (Google Workspace, Zoho, Brevo, Mailgun, Amazon SES) give you these details." },
  { name: "payments", label: "Payments", intro: "Students pay by card through Stripe, and by M-Pesa or mobile money through Paystack. Turn on either or both by adding its secret key." },
  { name: "video", label: "Classroom video", intro: "Live lessons run on LiveKit. Create a project at cloud.livekit.io and copy its address and API key here. Tutors' intro videos upload to Cloudflare Stream." },
  { name: "text", label: "SMS & WhatsApp", intro: "Lesson reminders by text message and WhatsApp, sent through Africa's Talking." },
  { name: "push", label: "Push notifications", intro: "Phone and browser notifications. They work without setup; only fill these in if you are moving from another server and want to keep existing subscriptions." },
];

export const KEYS: IntegrationKey[] = [
  { tab: "website", name: "siteUrl", env: "SITE_URL", label: "Website address", placeholder: "https://sabinaedge.com", description: "Include https://. Leave empty to use the address in your hosting settings." },

  { tab: "email", name: "smtpHost", env: "SMTP_HOST", label: "Mail server (SMTP host)", placeholder: "smtp.gmail.com", width: "50%" },
  { tab: "email", name: "smtpPort", env: "SMTP_PORT", label: "Port", placeholder: "587", width: "50%", description: "Usually 587, or 465 for SSL." },
  { tab: "email", name: "smtpUser", env: "SMTP_USER", label: "Username", placeholder: "you@yourdomain.com", width: "50%" },
  { tab: "email", name: "smtpPass", env: "SMTP_PASS", label: "Password or app password", secret: true, width: "50%" },
  { tab: "email", name: "fromAddress", env: "EMAIL_FROM", label: "Send emails from", placeholder: "hello@yourdomain.com", width: "50%" },
  { tab: "email", name: "fromName", env: "EMAIL_FROM_NAME", label: "Sender name", placeholder: "Sabina Edge", width: "50%" },

  { tab: "payments", name: "stripeSecretKey", env: "STRIPE_SECRET_KEY", label: "Stripe secret key", secret: true, placeholder: "sk_live_…", description: "Stripe dashboard › Developers › API keys." },
  { tab: "payments", name: "stripeWebhookSecret", env: "STRIPE_WEBHOOK_SECRET", label: "Stripe webhook signing secret", secret: true, placeholder: "whsec_…", description: "Add a webhook in Stripe pointing to the address shown above, then copy its signing secret." },
  { tab: "payments", name: "paystackSecretKey", env: "PAYSTACK_SECRET_KEY", label: "Paystack secret key", secret: true, placeholder: "sk_live_…", description: "Paystack dashboard › Settings › API keys & webhooks. Set the webhook address shown above there too." },

  { tab: "video", name: "livekitUrl", env: "LIVEKIT_URL", label: "LiveKit project address", placeholder: "wss://your-project.livekit.cloud" },
  { tab: "video", name: "livekitApiKey", env: "LIVEKIT_API_KEY", label: "LiveKit API key", width: "50%" },
  { tab: "video", name: "livekitApiSecret", env: "LIVEKIT_API_SECRET", label: "LiveKit API secret", secret: true, width: "50%" },
  { tab: "video", name: "streamAccountId", env: "CLOUDFLARE_STREAM_ACCOUNT_ID", label: "Cloudflare account ID", width: "50%", description: "For tutors' intro videos (optional)." },
  { tab: "video", name: "streamCustomerCode", env: "CLOUDFLARE_STREAM_CUSTOMER_CODE", label: "Cloudflare Stream customer code", width: "50%" },
  { tab: "video", name: "streamApiToken", env: "CLOUDFLARE_STREAM_API_TOKEN", label: "Cloudflare Stream API token", secret: true },

  { tab: "text", name: "atUsername", env: "AFRICASTALKING_USERNAME", label: "Africa's Talking username", width: "50%", description: "Use \"sandbox\" to test without sending real messages." },
  { tab: "text", name: "atApiKey", env: "AFRICASTALKING_API_KEY", label: "API key", secret: true, width: "50%" },
  { tab: "text", name: "atSenderId", env: "AFRICASTALKING_SENDER_ID", label: "SMS sender name", width: "50%", description: "Optional. Must be approved by Africa's Talking." },
  { tab: "text", name: "atWhatsappNumber", env: "AFRICASTALKING_WHATSAPP_NUMBER", label: "WhatsApp business number", width: "50%", description: "Optional. Leave empty to send SMS only." },

  { tab: "push", name: "vapidPublicKey", env: "VAPID_PUBLIC_KEY", label: "Public key" },
  { tab: "push", name: "vapidPrivateKey", env: "VAPID_PRIVATE_KEY", label: "Private key", secret: true },
];

export const SECRET_PATHS = KEYS.filter((k) => k.secret).map((k) => [k.tab, k.name] as const);

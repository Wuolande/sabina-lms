import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import { getPayloadClient } from "@/cms/auth/session";
import { KEYS } from "@/cms/integrations/keys";
import { applyIntegrations, siteAddress, sourceOf } from "@/cms/integrations/server";
import { emailReady } from "@/cms/email/adapter";
import { emailLayout } from "@/cms/email/layout";
import { enabledProviders } from "@/cms/payments/providers";
import { videoConfigured } from "@/cms/lessons/server";
import { streamConfigured } from "@/cms/media/stream";
import { sendTestText, textConfigured, whatsappConfigured } from "@/cms/notify/text";
import { jobStatus } from "@/cms/scheduling/housekeeping";

/** Status and test messages for Settings › Integrations & keys. Admins only. */
async function adminPayload() {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: await headers() });
  return (user as { role?: string } | null)?.role === "admin" ? payload : null;
}
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function GET() {
  const payload = await adminPayload();
  if (!payload) return fail("Only admins can see this.", 403);
  await applyIntegrations(payload, true);
  const site = siteAddress();
  const jobs = await jobStatus(payload).catch(() => null);
  const demoVideo = /demo\.livekit|^wss?:\/\/localhost/.test(process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL || "") || process.env.LIVEKIT_API_KEY === "devkey";
  return NextResponse.json(
    {
      keys: Object.fromEntries(KEYS.map((k) => [k.env, sourceOf(k.env)])),
      site,
      webhooks: { stripe: `${site}/api/payments/webhook/stripe`, paystack: `${site}/api/payments/webhook/paystack` },
      ready: {
        website: /^https:\/\//.test(site),
        email: emailReady(),
        payments: enabledProviders().some((p) => p.id !== "dev"),
        stripe: Boolean(process.env.STRIPE_SECRET_KEY),
        paystack: Boolean(process.env.PAYSTACK_SECRET_KEY),
        video: videoConfigured() && !demoVideo,
        demoVideo,
        stream: streamConfigured(),
        text: textConfigured(),
        whatsapp: whatsappConfigured(),
        push: true,
      },
      scheduler: jobs ? { last: jobs.last ?? null, lastCron: jobs.lastCron ?? null, hasKey: Boolean(jobs.secret) } : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: NextRequest) {
  const payload = await adminPayload();
  if (!payload) return fail("Only admins can do this.", 403);
  await applyIntegrations(payload, true);
  const body = (await req.json().catch(() => ({}))) as { tab?: string; to?: string };
  const to = String(body.to ?? "").trim();
  try {
    if (body.tab === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return fail("Enter an email address to send the test to.");
      if (!emailReady()) return fail("Add the mail server, username and password first, then save.");
      await payload.sendEmail({
        to,
        subject: "Test email from your Sabina Edge site",
        html: emailLayout({ preheader: "Your email settings work.", heading: "Email is working", body: ["This test was sent from Settings › Integrations & keys. Sign-up confirmations, password resets and booking emails will now be delivered."] }),
      });
      return NextResponse.json({ ok: true, message: `Sent to ${to}. Check the inbox (and the spam folder).` });
    }
    if (body.tab === "text") {
      if (!textConfigured()) return fail("Add the Africa's Talking username and API key first, then save.");
      const channel = await sendTestText(to, "Test message from your Sabina Edge site. Text reminders are working.");
      return NextResponse.json({ ok: true, message: `Sent by ${channel === "whatsapp" ? "WhatsApp" : "SMS"} to ${to}.` });
    }
    return fail("Nothing to test here.");
  } catch (err) {
    return fail(`It didn't work: ${err instanceof Error ? err.message : String(err)}`, 502);
  }
}

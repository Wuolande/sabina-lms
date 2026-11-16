import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient, getSessionUser } from "@/cms/auth/session";
import { EMAIL_RE, fail, guard, normEmail } from "@/cms/auth/http";

/** The public contact form. Saved for the support team, who reply by email. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const blocked = guard(req, body, "contact", { maxAttempts: 5, windowMs: 60 * 60 * 1000, lockoutDurationMs: 60 * 60 * 1000 });
  if (blocked) return blocked;
  const text = (k: string, max: number) => (typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : "");
  const name = text("name", 120);
  const email = normEmail(body.email);
  const subject = text("subject", 160);
  const message = text("message", 5000);
  if (!name) return fail("Enter your name.");
  if (!EMAIL_RE.test(email)) return fail("Enter an email address we can reply to.");
  if (!subject) return fail("Add a subject.");
  if (message.length < 10) return fail("Tell us a little more so we can help.");
  const [payload, user] = await Promise.all([getPayloadClient(), getSessionUser().catch(() => null)]);
  await payload.create({ collection: "contact-messages", data: { name, email, subject, message, status: "new", user: user?.id ?? null } as never, overrideAccess: true });
  return NextResponse.json({ ok: true });
}

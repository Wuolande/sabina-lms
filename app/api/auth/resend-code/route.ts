import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail, guard, normEmail } from "@/cms/auth/http";
import { verifyEmailHTML, verifyEmailSubject } from "@/cms/email/auth";

/**
 * POST /api/auth/resend-code { email }: send the confirmation email again.
 * Always answers the same way, so it can't be used to find out which emails have accounts.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = normEmail(body.email);
  const blocked = guard(req, body, `resend_${email}`, { maxAttempts: 3, windowMs: 10 * 60_000, lockoutDurationMs: 10 * 60_000 });
  if (blocked) return blocked;
  if (!email) return fail("Enter your email address.");

  const payload = await getPayloadClient();
  const found = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    showHiddenFields: true,
  });
  const user = found.docs[0] as unknown as { firstName?: string; _verified?: boolean; _verificationToken?: string } | undefined;
  if (user && !user._verified && user._verificationToken) {
    await payload
      .sendEmail({ to: email, subject: verifyEmailSubject(), html: verifyEmailHTML({ token: user._verificationToken, user }) })
      .catch((err: unknown) => payload.logger.error({ err }, "[auth/resend-code]"));
  }
  return NextResponse.json({ success: true });
}

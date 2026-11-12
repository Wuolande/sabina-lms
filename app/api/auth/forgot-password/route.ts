import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail, guard, normEmail } from "@/cms/auth/http";

/** POST /api/auth/forgot-password { email }: email a reset link (same answer whether or not the account exists). */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = normEmail(body.email);
  const blocked = guard(req, body, `forgot_${email}`, { maxAttempts: 3, windowMs: 15 * 60_000, lockoutDurationMs: 15 * 60_000 });
  if (blocked) return blocked;
  if (!email) return fail("Enter your email address.");

  const payload = await getPayloadClient();
  try {
    await payload.forgotPassword({ collection: "users", data: { email } });
  } catch (err) {
    payload.logger.error({ err }, "[auth/forgot-password]");
  }
  return NextResponse.json({ success: true });
}

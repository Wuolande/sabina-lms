import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient, homeFor } from "@/cms/auth/session";
import { fail, guard, normEmail, publicUser, withSessionCookie } from "@/cms/auth/http";
import { resetRateLimit } from "@/src/shared/security/rateLimiter";
import { clientIp } from "@/cms/auth/http";

/** POST /api/auth/login: sign in a student, tutor or staff member and set the session cookie. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = normEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) return fail("Enter your email and password.");

  const blocked = guard(req, body, `login_${email}`, { maxAttempts: 8, windowMs: 5 * 60_000, lockoutDurationMs: 15 * 60_000 });
  if (blocked) return blocked;

  const payload = await getPayloadClient();
  try {
    const result = await payload.login({ collection: "users", data: { email, password } });
    if (!result.token || !result.user) return fail("Sign-in didn't work. Please try again.", 401);
    resetRateLimit(`login_${email}_${clientIp(req)}`);
    const user = result.user;
    const res = NextResponse.json({ success: true, user: publicUser(user), redirectTo: homeFor(user.role) });
    return withSessionCookie(res, payload, result.token);
  } catch (err) {
    const e = err as { name?: string; message?: string; status?: number };
    if (e.name === "UnverifiedEmail") {
      return fail("Please confirm your email address before signing in.", 403, { requiresEmailConfirmation: true, email });
    }
    if (e.name === "LockedAuth") return fail("Too many failed attempts. This account is locked for 15 minutes.", 423);
    if (e.status === 403) return fail(e.message || "This account is not active.", 403);
    if (e.name === "AuthenticationError" || e.status === 401) return fail("That email and password don't match.", 401);
    payload.logger.error({ err }, "[auth/login]");
    return fail("Something went wrong. Please try again.", 500);
  }
}

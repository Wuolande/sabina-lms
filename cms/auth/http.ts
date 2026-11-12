import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { generateExpiredPayloadCookie, generatePayloadCookie, type Payload } from "payload";
import { checkHoneypot } from "@/src/shared/security/honeypot";
import { checkRateLimit, type RateLimitOptions } from "@/src/shared/security/rateLimiter";

export const clientIp = (req: NextRequest) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "127.0.0.1";

export const fail = (error: string, status = 400, extra?: Record<string, unknown>) => NextResponse.json({ error, ...extra }, { status });

export const normEmail = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "");
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Password policy for every account: 8+ characters with a letter and a number. */
export function passwordProblem(pw: unknown): string | null {
  if (typeof pw !== "string" || pw.length < 8) return "Use at least 8 characters for your password.";
  if (pw.length > 128) return "That password is too long.";
  if (!/[a-z]/i.test(pw) || !/\d/.test(pw)) return "Use at least one letter and one number in your password.";
  return null;
}

/**
 * Common protections for public auth forms: honeypot fields and an IP+key rate limit.
 * Returns an error response, or null when the request may continue.
 */
export function guard(req: NextRequest, body: Record<string, unknown>, key: string, opts: RateLimitOptions): NextResponse | null {
  if (checkHoneypot(body).isBot) return fail("Request rejected.", 400);
  // Automated test runs may switch rate limiting off; this is ignored in production.
  if (process.env.AUTH_RATE_LIMIT === "off" && process.env.NODE_ENV !== "production") return null;
  const rl = checkRateLimit(`${key}_${clientIp(req)}`, opts);
  if (!rl.allowed) return fail(`Too many attempts. Please wait ${rl.retryAfterSeconds} seconds and try again.`, 429, { retryAfterSeconds: rl.retryAfterSeconds });
  return null;
}

const usersAuth = (payload: Payload) => payload.collections.users.config.auth;

export function withSessionCookie(res: NextResponse, payload: Payload, token: string) {
  res.headers.append("Set-Cookie", generatePayloadCookie({ collectionAuthConfig: usersAuth(payload), cookiePrefix: payload.config.cookiePrefix, token }));
  return res;
}

export function clearSessionCookie(res: NextResponse, payload: Payload) {
  res.headers.append("Set-Cookie", generateExpiredPayloadCookie({ collectionAuthConfig: usersAuth(payload), cookiePrefix: payload.config.cookiePrefix }));
  return res;
}

export const publicUser = (u: { id: unknown; email?: unknown; name?: unknown; firstName?: unknown; lastName?: unknown; role?: unknown; status?: unknown; timezone?: unknown }) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  firstName: u.firstName,
  lastName: u.lastName,
  role: u.role,
  status: u.status,
  timezone: u.timezone,
});

import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { EMAIL_RE, fail, guard, normEmail, passwordProblem } from "@/cms/auth/http";
import { isKnownZone } from "@/cms/geo/server";

const clean = (v: unknown, max = 60) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

/**
 * POST /api/auth/register: create a student or tutor account and send the confirmation email.
 * Staff accounts can only be created in the admin.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const blocked = guard(req, body, "register", { maxAttempts: 6, windowMs: 10 * 60_000, lockoutDurationMs: 30 * 60_000 });
  if (blocked) return blocked;

  const email = normEmail(body.email);
  const firstName = clean(body.firstName);
  const lastName = clean(body.lastName);
  const role = String(body.role ?? "").toLowerCase() === "tutor" ? "tutor" : "student";
  const timezoneIn = clean(body.timezone, 64) || "UTC";

  if (!firstName || !lastName) return fail("Enter your first and last name.");
  if (!EMAIL_RE.test(email)) return fail("Enter a valid email address.");
  const pw = passwordProblem(body.password);
  if (pw) return fail(pw);
  if (body.acceptTerms !== true) return fail("Please accept the terms and privacy policy to continue.");

  const payload = await getPayloadClient();
  // The browser's zone, if it is one we offer; otherwise UTC (they can change it in Settings).
  const timezone = (await isKnownZone(payload, timezoneIn)) ? timezoneIn : "UTC";
  const existing = await payload.count({ collection: "users", where: { email: { equals: email } }, overrideAccess: true });
  if (existing.totalDocs > 0) {
    return fail("An account with this email already exists. Sign in, or reset your password.", 409, { code: "EMAIL_TAKEN" });
  }

  try {
    // overrideAccess: false so the collection's rules apply (public sign-up can't pick a staff role).
    await payload.create({
      collection: "users",
      overrideAccess: false,
      data: { email, password: String(body.password), firstName, lastName, role, timezone, status: "active" } as never,
    });
    return NextResponse.json({ success: true, requiresEmailConfirmation: true, email, role }, { status: 201 });
  } catch (err) {
    payload.logger.error({ err }, "[auth/register]");
    return fail("We couldn't create your account. Please try again.", 500);
  }
}

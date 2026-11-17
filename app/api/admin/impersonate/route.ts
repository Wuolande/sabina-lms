import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient, homeFor } from "@/cms/auth/session";
import { fail, withSessionCookie } from "@/cms/auth/http";
import { ADMIN_COOKIE, BANNER_COOKIE, IMPERSONATION_SECONDS, ImpersonationError, isImpersonating, startImpersonation } from "@/cms/auth/impersonate";
import type { User } from "@/payload-types";

const secure = process.env.NODE_ENV === "production";

/** POST { userId } (admins only): log in as that student or tutor for up to an hour. */
export async function POST(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user) return fail("Please sign in.", 401);
  const current = req.cookies.get(`${payload.config.cookiePrefix}-token`)?.value;
  if (await isImpersonating(current)) return fail("Go back to your admin account first.", 409);
  const body = (await req.json().catch(() => ({}))) as { userId?: unknown };
  try {
    const { token, target } = await startImpersonation(payload, user, Number(body.userId));
    const res = NextResponse.json({ success: true, redirectTo: homeFor(target.role) });
    res.cookies.set(ADMIN_COOKIE, current ?? "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: IMPERSONATION_SECONDS + 600 });
    const name = `${target.firstName ?? ""} ${target.lastName ?? ""}`.trim() || target.email;
    res.cookies.set(BANNER_COOKIE, JSON.stringify({ name, role: target.role, id: target.id }), { secure, sameSite: "lax", path: "/", maxAge: IMPERSONATION_SECONDS + 600 });
    // Last: res.cookies.set rewrites Set-Cookie headers added before it.
    return withSessionCookie(res, payload, token);
  } catch (err) {
    if (err instanceof ImpersonationError) return fail(err.message, err.status);
    payload.logger.error({ err }, "[impersonate] start failed");
    return fail("Couldn't log in as that user.", 500);
  }
}

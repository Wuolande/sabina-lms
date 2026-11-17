import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { clearSessionCookie, withSessionCookie } from "@/cms/auth/http";
import { ADMIN_COOKIE, BANNER_COOKIE, stopImpersonation } from "@/cms/auth/impersonate";

/** POST: leave the user's account and go back to the admin's own (or sign out if that has ended). */
export async function POST(req: NextRequest) {
  const payload = await getPayloadClient();
  const back = await stopImpersonation(payload, req.cookies.get(`${payload.config.cookiePrefix}-token`)?.value, req.cookies.get(ADMIN_COOKIE)?.value);
  const res = NextResponse.json({ success: true, redirectTo: back ? (back.viewed ? `/admin/collections/users/${back.viewed}` : "/admin") : "/login" });
  res.cookies.delete(ADMIN_COOKIE);
  res.cookies.delete(BANNER_COOKIE);
  // Last: res.cookies rewrites Set-Cookie headers added before it.
  return back ? withSessionCookie(res, payload, back.token) : clearSessionCookie(res, payload);
}

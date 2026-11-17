import { NextResponse, type NextRequest } from "next/server";

/** Invite link: remember who invited this visitor for 30 days, then open the sign-up page. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code).trim().toUpperCase().slice(0, 20);
  const url = new URL("/register", req.url);
  if (/^[A-Z]{1,8}-[A-Z0-9]{4}$/.test(code)) url.searchParams.set("ref", code);
  const res = NextResponse.redirect(url);
  if (url.searchParams.has("ref")) res.cookies.set("sb_ref", code, { maxAge: 30 * 86400, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  return res;
}

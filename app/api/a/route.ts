import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { isBot, newId, parseAgent, recordEvent, sourceOf } from "@/cms/analytics/store";

/**
 * Page-view collector for Sabina's own analytics (see cms/analytics/store.ts). Called by the
 * browser on every page. Stores the page path only (never query strings), no IP address.
 */
const YEAR = 60 * 60 * 24 * 365;
const SESSION = 60 * 30;

/** Paths that carry private tokens are stored as a pattern, not the real value. */
function cleanPath(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.startsWith("/")) return null;
  const path = raw.split(/[?#]/)[0]!.slice(0, 300);
  if (/^\/(admin|api|_next)(\/|$)/.test(path)) return null;
  return path.replace(/^\/progress\/[^/]+/, "/progress/[link]").replace(/^\/(reset-password|verify-email)\/.+/, "/$1");
}

export async function POST(req: NextRequest) {
  const none = new NextResponse(null, { status: 204 });
  if (req.headers.get("dnt") === "1" || req.headers.get("sec-gpc") === "1") return none;
  const ua = req.headers.get("user-agent") ?? "";
  if (isBot(ua)) return none;
  const body = (await req.json().catch(() => ({}))) as { p?: string; r?: string; us?: string; um?: string; uc?: string };
  const path = cleanPath(body.p);
  if (!path) return none;

  const visitor = req.cookies.get("sb_vid")?.value || newId();
  const existing = req.cookies.get("sb_sid")?.value;
  const session = existing || newId();
  const entry = !existing;
  const { device, browser, os } = parseAgent(ua);
  const host = req.headers.get("host") ?? "";
  const src = entry || body.us ? sourceOf(body.r, host.split(":")[0]!, { source: body.us, medium: body.um }) : null;

  const payload = await getPayloadClient();
  await recordEvent(payload, {
    type: "pageview",
    path,
    visitor,
    session,
    source: src?.source ?? null,
    channel: src?.channel ?? null,
    country: req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || null,
    device,
    browser,
    os,
    meta: entry ? { entry: true, ...(body.uc ? { campaign: String(body.uc).slice(0, 80) } : {}) } : null,
  });

  const res = new NextResponse(null, { status: 204 });
  const secure = req.nextUrl.protocol === "https:";
  res.cookies.set("sb_vid", visitor, { maxAge: YEAR, path: "/", sameSite: "lax", secure, httpOnly: true });
  res.cookies.set("sb_sid", session, { maxAge: SESSION, path: "/", sameSite: "lax", secure, httpOnly: true });
  return res;
}

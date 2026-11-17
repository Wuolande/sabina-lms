import type { Payload } from "payload";
import { sql } from "@payloadcms/db-postgres";

/**
 * Sabina's own analytics: page views and key actions, stored in our database (table
 * analytics.events, kept outside Payload's schema so schema syncs never touch it).
 *
 * Privacy: no IP addresses or names are stored. A visitor is a random id in a first-party cookie
 * (sb_vid, 1 year); a session is another (sb_sid, 30 minutes since the last page). Signed-in
 * users' actions carry their user id so the funnel can follow sign-up → booking → repeat booking.
 * Browsers that send "Do Not Track" are not counted. Events older than 25 months are deleted.
 */
export type EventType = "pageview" | "signup" | "login" | "booking_created" | "payment_succeeded" | "lesson_completed" | "review_submitted" | "referral_signup" | "impersonation";
export type Channel = "direct" | "search" | "social" | "email" | "referral" | "campaign";

export type EventInput = {
  type: EventType;
  path?: string | null;
  visitor?: string | null;
  session?: string | null;
  userId?: number | null;
  source?: string | null;
  channel?: Channel | null;
  country?: string | null;
  device?: string | null;
  browser?: string | null;
  os?: string | null;
  meta?: Record<string, unknown> | null;
};

const cut = (v: unknown, n: number) => (typeof v === "string" && v ? v.slice(0, n) : null);

export async function recordEvent(payload: Payload, e: EventInput) {
  try {
    await payload.db.drizzle.execute(sql`
      insert into analytics.events (type, path, visitor, session, user_id, source, channel, country, device, browser, os, meta)
      values (${e.type}, ${cut(e.path, 300)}, ${cut(e.visitor, 40)}, ${cut(e.session, 40)}, ${e.userId ?? null}, ${cut(e.source, 120)}, ${cut(e.channel, 20)},
              ${cut(e.country, 2)}, ${cut(e.device, 10)}, ${cut(e.browser, 20)}, ${cut(e.os, 20)}, ${e.meta ? JSON.stringify(e.meta) : null}::jsonb)
    `);
  } catch (err) {
    // Analytics must never break the action being tracked.
    payload.logger.warn({ err: (err as Error).message }, "[analytics] event not stored");
  }
}

/** Record a server-side action (sign-up, booking, payment…), never throwing. */
export function track(payload: Payload, type: EventType, opts: { userId?: number | null; visitor?: string | null; meta?: Record<string, unknown> } = {}) {
  return recordEvent(payload, { type, userId: opts.userId ?? null, visitor: opts.visitor ?? null, meta: opts.meta ?? null });
}

/** Keep two years and a month of history. */
export async function pruneEvents(payload: Payload) {
  await payload.db.drizzle.execute(sql`delete from analytics.events where at < now() - interval '25 months'`).catch(() => undefined);
}

/* ------------------------------------------------------------------ request helpers */

const BOT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link|whatsapp\/|telegrambot|discordbot|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|curl|wget|python|axios|node-fetch|go-http|java\/|playwright|puppeteer|phantom/i;
export const isBot = (ua: string) => !ua || BOT.test(ua);

export function parseAgent(ua: string) {
  const device = /iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(ua) ? "tablet" : /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua) ? "mobile" : "desktop";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /CriOS|Chrome\//.test(ua) ? "Chrome" : /FxiOS|Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Other";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS X|Macintosh/.test(ua) ? "macOS" : /CrOS/.test(ua) ? "ChromeOS" : /Linux/.test(ua) ? "Linux" : "Other";
  return { device, browser, os };
}

const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|baidu|yandex|brave|startpage)\./i;
const SOCIAL = /(^|\.)(facebook|fb|instagram|t\.co|twitter|x\.com|linkedin|lnkd|tiktok|youtube|youtu\.be|whatsapp|wa\.me|pinterest|reddit|snapchat|telegram)/i;

/** Where a visit came from: a campaign (utm_source), another site, or nowhere (direct). */
export function sourceOf(referrer: string | null | undefined, ownHost: string, utm: { source?: string | null; medium?: string | null }): { source: string; channel: Channel } {
  const medium = (utm.medium || "").toLowerCase();
  if (utm.source) {
    const s = utm.source.toLowerCase().slice(0, 120);
    return { source: s, channel: medium === "email" ? "email" : SEARCH.test(`${s}.`) ? "search" : SOCIAL.test(s) ? "social" : "campaign" };
  }
  let host = "";
  try {
    host = referrer ? new URL(referrer).hostname.replace(/^www\./, "").toLowerCase() : "";
  } catch {
    host = "";
  }
  if (!host || host === ownHost.replace(/^www\./, "")) return { source: "Direct", channel: "direct" };
  if (SEARCH.test(host)) return { source: host, channel: "search" };
  if (SOCIAL.test(host)) return { source: host, channel: "social" };
  if (/mail\.|outlook|gmail/.test(host)) return { source: host, channel: "email" };
  return { source: host, channel: "referral" };
}

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;

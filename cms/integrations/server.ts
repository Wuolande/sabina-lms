import type { Payload } from "payload";
import { KEYS } from "./keys";

/**
 * Makes the keys saved in Settings › Integrations & keys available to the rest of the site, by
 * placing them in the process environment under the usual names (SMTP_HOST, STRIPE_SECRET_KEY…).
 * A value saved in the admin wins; an empty one falls back to the hosting settings.
 *
 * Loaded when Payload starts, again after every save, and at most a minute after a save made on
 * another server instance.
 */
type State = { at: number; inflight: Promise<void> | null; original: Record<string, string | undefined> };
const g = globalThis as typeof globalThis & { __sabinaIntegrations?: State };
const state: State = (g.__sabinaIntegrations ??= { at: 0, inflight: null, original: Object.fromEntries(KEYS.map((k) => [k.env, process.env[k.env]])) });

const FRESH_MS = 60_000;

export function applyIntegrations(payload: Payload, force = false): Promise<void> {
  if (process.env.NEXT_PHASE === "phase-production-build") return Promise.resolve();
  if (!force && Date.now() - state.at < FRESH_MS) return Promise.resolve();
  if (state.inflight && !force) return state.inflight;
  state.inflight = (async () => {
    try {
      const doc = (await payload.findGlobal({ slug: "integrations" as never, depth: 0, overrideAccess: true, context: { reveal: true } })) as unknown as Record<string, Record<string, unknown> | undefined>;
      for (const k of KEYS) {
        const v = doc?.[k.tab]?.[k.name];
        const value = typeof v === "string" ? v.trim() : "";
        if (value) process.env[k.env] = value;
        else if (state.original[k.env] !== undefined) process.env[k.env] = state.original[k.env];
        else delete process.env[k.env];
      }
      allowSiteAddress(payload);
    } catch (err) {
      // Before the first migration the table doesn't exist yet; the hosting settings apply.
      payload.logger.debug?.({ err }, "[integrations] not loaded");
    } finally {
      state.at = Date.now();
      state.inflight = null;
    }
  })();
  return state.inflight;
}

/** Let the admin's website address use the admin and API (CSRF / CORS allow-list). */
function allowSiteAddress(payload: Payload) {
  const url = (process.env.SITE_URL || "").replace(/\/+$/, "");
  if (!/^https?:\/\//.test(url)) return;
  for (const list of [payload.config.csrf, payload.config.cors]) if (Array.isArray(list) && !list.includes(url)) list.push(url);
}

/** Where each key currently comes from: saved in the admin, the hosting settings, or nowhere. */
const OLDER_NAMES: Record<string, string> = { SITE_URL: "NEXT_PUBLIC_APP_URL", LIVEKIT_URL: "NEXT_PUBLIC_LIVEKIT_URL" };

export function sourceOf(env: string): "admin" | "hosting" | "missing" {
  const now = process.env[env];
  if (!now) return OLDER_NAMES[env] && process.env[OLDER_NAMES[env]] ? "hosting" : "missing";
  return state.original[env] !== undefined && state.original[env] === now ? "hosting" : "admin";
}

/** The public address of the site, from the admin or the hosting settings. */
export const siteAddress = () => (process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");

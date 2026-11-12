import "server-only";
import { randomBytes, timingSafeEqual } from "node:crypto";
import type { Payload } from "payload";

const EVERY_MS = 5 * 60_000;
const store = globalThis as unknown as { __sabinaHousekeepingAt?: number; __sabinaHousekeepingRunning?: boolean };

export type JobSource = "cron" | "traffic" | "manual";
export type JobRun = { at: string; source: JobSource; ok: boolean; ms: number; error?: string };
const LAST = "jobs:housekeeping:last";
const LAST_CRON = "jobs:housekeeping:lastCron";
const SECRET = "jobs:secret";

/**
 * Expire unpaid holds and unanswered requests, settle attendance and send lesson reminders.
 * Called by an external scheduler (see Admin → Scheduled jobs), Vercel's daily cron, and, at most
 * every 5 minutes per server, in the background of portal traffic. Every step is safe to repeat.
 */
export async function runHousekeeping(payload: Payload, source: JobSource = "traffic") {
  const forced = source !== "traffic";
  if (!forced && (store.__sabinaHousekeepingRunning || Date.now() - (store.__sabinaHousekeepingAt ?? 0) < EVERY_MS)) return null;
  store.__sabinaHousekeepingRunning = true;
  store.__sabinaHousekeepingAt = Date.now();
  const started = Date.now();
  let run: JobRun;
  try {
    const { expireStale } = await import("./server");
    await expireStale(payload);
    run = { at: new Date().toISOString(), source, ok: true, ms: Date.now() - started };
  } catch (err) {
    payload.logger.error({ err }, "[housekeeping] failed");
    run = { at: new Date().toISOString(), source, ok: false, ms: Date.now() - started, error: err instanceof Error ? err.message : String(err) };
  } finally {
    store.__sabinaHousekeepingRunning = false;
  }
  await payload.kv.set(LAST, run).catch(() => undefined);
  if (source === "cron") await payload.kv.set(LAST_CRON, run).catch(() => undefined);
  return run;
}

export async function jobStatus(payload: Payload) {
  const [last, lastCron, secret] = await Promise.all([payload.kv.get<JobRun>(LAST), payload.kv.get<JobRun>(LAST_CRON), cronSecret(payload)]);
  return { last, lastCron, secret, secretFromEnv: Boolean(process.env.CRON_SECRET) };
}

/** The key external schedulers must send. CRON_SECRET wins; otherwise one created in the admin. */
export async function cronSecret(payload: Payload): Promise<string | null> {
  return process.env.CRON_SECRET || (await payload.kv.get<string>(SECRET).catch(() => null)) || null;
}

export async function newCronSecret(payload: Payload) {
  const key = randomBytes(24).toString("base64url");
  await payload.kv.set(SECRET, key);
  return key;
}

/** Accepts `Authorization: Bearer <key>` or `?key=<key>` (for schedulers that can't set headers). */
export async function cronAuthorized(payload: Payload, header: string | null, queryKey: string | null) {
  const secret = await cronSecret(payload);
  if (!secret) return false;
  const given = header?.startsWith("Bearer ") ? header.slice(7) : queryKey;
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

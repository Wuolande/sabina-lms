import "server-only";
import type { Payload } from "payload";
import type { User } from "@/payload-types";
import { withNote, type Mail } from "../email/layout";
import { EMAIL_CATALOGUE, OPTIONAL, type EmailKey } from "./catalogue";

type Template = { key: string; enabled?: boolean | null; note?: string | null };
// Kept on globalThis: Next bundles route groups separately, and the admin's save hook must clear the same cache.
const store = globalThis as unknown as { __sabinaEmailTemplates?: { at: number; rows: Map<string, Template> } | null };

/** Admin settings for each email. Missing rows are created so every email shows up in the admin. */
async function templates(payload: Payload) {
  const cache = store.__sabinaEmailTemplates;
  if (cache && Date.now() - cache.at < 30_000) return cache.rows;
  const found = await payload.find({ collection: "email-templates", limit: 200, pagination: false, depth: 0, overrideAccess: true });
  const rows = new Map(found.docs.map((d) => [d.key as string, d as Template]));
  for (const e of EMAIL_CATALOGUE) {
    if (rows.has(e.key)) continue;
    const doc = await payload
      .create({ collection: "email-templates", data: { key: e.key, name: e.name, audience: e.audience, description: e.description, enabled: true }, overrideAccess: true })
      .catch(() => null);
    if (doc) rows.set(e.key, doc as Template);
  }
  store.__sabinaEmailTemplates = { at: Date.now(), rows };
  return rows;
}
export const clearTemplateCache = () => void (store.__sabinaEmailTemplates = null);

/**
 * Send a transactional email and log it. When `to` is a user, the same message also lands in
 * their in-app notifications. Never throws: a failed email must not break the action behind it.
 */
export async function deliver(payload: Payload, to: User | string, mail: Mail, opts: { inApp?: boolean } = {}) {
  const user = typeof to === "string" ? null : to;
  const email = user ? user.email : (to as string);
  try {
    if (user && opts.inApp !== false) await notify(payload, user.id, { kind: mail.key, ...mail.notice });
    const t = (await templates(payload)).get(mail.key);
    const pref = OPTIONAL[mail.key as EmailKey];
    const optedOut = pref && user && (user.emailPrefs as Record<string, boolean | null> | undefined)?.[pref] === false;
    if (t?.enabled === false || optedOut) {
      await log(payload, email, mail, "off", optedOut ? "Turned off by the recipient" : "Turned off in the admin");
      return;
    }
    await payload.sendEmail({ to: email, subject: mail.subject, html: withNote(mail.html, t?.note) });
    await log(payload, email, mail, process.env.SMTP_HOST ? "sent" : "no_smtp");
  } catch (err) {
    payload.logger.error({ err, key: mail.key }, "[email] failed");
    await log(payload, email, mail, "failed", err instanceof Error ? err.message : String(err)).catch(() => undefined);
  }
}

const log = (payload: Payload, to: string, mail: Mail, status: "sent" | "failed" | "off" | "no_smtp", error?: string) =>
  payload.create({ collection: "email-log", data: { to, subject: mail.subject, template: mail.key, status, error }, overrideAccess: true }).catch(() => undefined);

/** In-app notification only. */
export async function notify(payload: Payload, userId: number, n: { kind: string; title: string; body?: string | null; href?: string | null }) {
  await payload.create({ collection: "notifications", data: { user: userId, kind: n.kind, title: n.title, body: n.body ?? null, href: n.href ?? null }, overrideAccess: true }).catch((err) => payload.logger.error({ err }, "[notify] failed"));
}

import type { NotificationView } from "./types";
export type { NotificationView };

export async function listNotifications(payload: Payload, user: User, limit = 60): Promise<NotificationView[]> {
  const r = await payload.find({ collection: "notifications", where: { user: { equals: user.id } }, sort: "-createdAt", limit, depth: 0, overrideAccess: true });
  return r.docs.map((n) => ({ id: n.id, kind: n.kind ?? "", title: n.title, body: n.body ?? null, href: n.href ?? null, at: n.createdAt, read: Boolean(n.readAt) }));
}

export async function markRead(payload: Payload, user: User, ids: number[] | "all") {
  const where = ids === "all" ? { and: [{ user: { equals: user.id } }, { readAt: { exists: false } }] } : { and: [{ user: { equals: user.id } }, { id: { in: ids } }] };
  await payload.update({ collection: "notifications", where: where as never, data: { readAt: new Date().toISOString() }, overrideAccess: true, depth: 0 });
}

/** Badge counts for the portal: unread notifications and conversations with unread messages. */
export async function badgeCounts(payload: Payload, user: User) {
  const [n, { unreadConversations }] = await Promise.all([
    payload.count({ collection: "notifications", where: { and: [{ user: { equals: user.id } }, { readAt: { exists: false } }] }, overrideAccess: true }),
    import("../messages/server").then(async (m) => ({ unreadConversations: await m.unreadCount(payload, user) })),
  ]);
  return { notifications: n.totalDocs, messages: unreadConversations };
}

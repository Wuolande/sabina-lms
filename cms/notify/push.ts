import "server-only";
import type { Payload } from "payload";
import webpush from "web-push";

const KEY = "sabina:vapid";
type Keys = { publicKey: string; privateKey: string };

/**
 * The key pair browsers use to trust our push messages. Taken from VAPID_PUBLIC_KEY /
 * VAPID_PRIVATE_KEY when set; otherwise made once and kept in the database, so push works
 * without any setup.
 */
export async function vapidKeys(payload: Payload): Promise<Keys> {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  const stored = await payload.kv.get<Keys>(KEY).catch(() => null);
  if (stored?.publicKey && stored.privateKey) return stored;
  const made = webpush.generateVAPIDKeys();
  await payload.kv.set(KEY, made);
  return made;
}

const subject = () => `mailto:${process.env.SUPPORT_EMAIL || process.env.SMTP_FROM_ADDRESS || "support@sabina.app"}`;

export async function saveSubscription(payload: Payload, userId: number, sub: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }, device: string) {
  const endpoint = String(sub.endpoint ?? "");
  const p256dh = String(sub.keys?.p256dh ?? "");
  const auth = String(sub.keys?.auth ?? "");
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !p256dh || !auth) throw new Error("Invalid subscription");
  const found = await payload.find({ collection: "push-subscriptions", where: { endpoint: { equals: endpoint } }, limit: 1, depth: 0, overrideAccess: true });
  const data = { user: userId, endpoint, p256dh, auth, device: device.slice(0, 120) };
  if (found.docs[0]) await payload.update({ collection: "push-subscriptions", id: found.docs[0].id, data, overrideAccess: true });
  else await payload.create({ collection: "push-subscriptions", data, overrideAccess: true });
}

export async function removeSubscription(payload: Payload, userId: number, endpoint: string) {
  await payload.delete({ collection: "push-subscriptions", where: { and: [{ endpoint: { equals: endpoint } }, { user: { equals: userId } }] }, overrideAccess: true });
}

export async function hasPush(payload: Payload, userId: number) {
  return (await payload.count({ collection: "push-subscriptions", where: { user: { equals: userId } }, overrideAccess: true })).totalDocs > 0;
}

/** Send to every device the person turned push on for. Dead subscriptions are removed. */
export async function sendPush(payload: Payload, userId: number, msg: { title: string; body?: string | null; href?: string | null; tag?: string }) {
  const subs = await payload.find({ collection: "push-subscriptions", where: { user: { equals: userId } }, limit: 20, depth: 0, overrideAccess: true });
  if (!subs.docs.length) return 0;
  const keys = await vapidKeys(payload);
  const body = JSON.stringify({ title: msg.title, body: msg.body ?? "", href: msg.href ?? "/", tag: msg.tag });
  let sent = 0;
  await Promise.all(
    subs.docs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { vapidDetails: { subject: subject(), publicKey: keys.publicKey, privateKey: keys.privateKey }, TTL: 3600 });
        sent++;
        await payload.update({ collection: "push-subscriptions", id: s.id, data: { lastSentAt: new Date().toISOString() }, overrideAccess: true }).catch(() => undefined);
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await payload.delete({ collection: "push-subscriptions", id: s.id, overrideAccess: true }).catch(() => undefined);
        else payload.logger.warn({ err: (err as Error).message, code }, "[push] not sent");
      }
    }),
  );
  return sent;
}

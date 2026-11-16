import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { removeSubscription, saveSubscription, sendPush, vapidKeys } from "@/cms/notify/push";
import type { User } from "@/payload-types";

async function me(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  return { payload, user };
}

/** GET : the public key browsers need to subscribe. */
export async function GET(req: NextRequest) {
  const { payload } = await me(req);
  return NextResponse.json({ publicKey: (await vapidKeys(payload)).publicKey }, { headers: { "Cache-Control": "no-store" } });
}

/** POST { subscription, test? } : turn push on for this device (test: send a hello). */
export async function POST(req: NextRequest) {
  const { payload, user } = await me(req);
  if (!user) return fail("Please sign in.", 401);
  const b = (await req.json().catch(() => ({}))) as { subscription?: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }; test?: boolean };
  try {
    if (b.subscription) await saveSubscription(payload, user.id, b.subscription, req.headers.get("user-agent") ?? "");
  } catch {
    return fail("That device couldn't be set up for notifications.");
  }
  if (b.test) await sendPush(payload, user.id, { title: "Notifications are on", body: "We'll let you know about lessons and messages here.", href: user.role === "tutor" ? "/tutor" : "/student", tag: "hello" });
  return NextResponse.json({ success: true });
}

/** DELETE { endpoint } : turn push off for this device. */
export async function DELETE(req: NextRequest) {
  const { payload, user } = await me(req);
  if (!user) return fail("Please sign in.", 401);
  const b = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (b.endpoint) await removeSubscription(payload, user.id, String(b.endpoint));
  return NextResponse.json({ success: true });
}

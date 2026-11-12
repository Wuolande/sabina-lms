import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/cms/auth/api";
import { badgeCounts, listNotifications, markRead } from "@/cms/notify/server";

const noStore = { headers: { "Cache-Control": "no-store" } };

/** GET: notifications + badge counts. GET ?counts=1: only the counts (polled by the portal). */
export const GET = (req: NextRequest) =>
  withUser(req, "notifications", async (payload, user) => {
    const counts = await badgeCounts(payload, user);
    if (req.nextUrl.searchParams.get("counts")) return NextResponse.json(counts, noStore);
    return NextResponse.json({ ...counts, notifications: await listNotifications(payload, user) }, noStore);
  });

/** POST { ids: number[] } or { all: true }: mark as read. */
export const POST = (req: NextRequest) =>
  withUser(req, "notifications", async (payload, user) => {
    const b = (await req.json().catch(() => ({}))) as { ids?: number[]; all?: boolean };
    await markRead(payload, user, b.all ? "all" : (b.ids ?? []).map(Number).filter(Boolean));
    return NextResponse.json({ success: true });
  });

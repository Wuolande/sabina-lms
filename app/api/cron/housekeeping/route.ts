import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { expireStale } from "@/cms/scheduling/server";

/**
 * Scheduled housekeeping: expire unpaid holds and unanswered requests, settle attendance, send
 * lesson reminders. Call every 5–15 minutes with `Authorization: Bearer $CRON_SECRET`
 * (Vercel Cron sends this header automatically when CRON_SECRET is set).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return fail("Not allowed.", 401);
  const payload = await getPayloadClient();
  const started = Date.now();
  await expireStale(payload);
  return NextResponse.json({ ok: true, ms: Date.now() - started });
}

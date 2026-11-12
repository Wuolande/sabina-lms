import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { cronAuthorized, runHousekeeping } from "@/cms/scheduling/housekeeping";

export const maxDuration = 60;

/**
 * Scheduled housekeeping: expire unpaid holds and unanswered requests, settle attendance, send
 * lesson reminders. Set up an external scheduler in Admin → Scheduled jobs. Authenticate with
 * `Authorization: Bearer <key>` (Vercel Cron does this with CRON_SECRET) or `?key=<key>`.
 */
async function handle(req: NextRequest) {
  const payload = await getPayloadClient();
  if (!(await cronAuthorized(payload, req.headers.get("authorization"), req.nextUrl.searchParams.get("key")))) return fail("Not allowed.", 401);
  const run = await runHousekeeping(payload, "cron");
  return NextResponse.json(run, { status: run?.ok ? 200 : 500, headers: { "Cache-Control": "no-store" } });
}
export const GET = handle;
export const POST = handle;

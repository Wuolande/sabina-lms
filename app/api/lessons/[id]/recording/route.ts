import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { BookingError } from "@/cms/scheduling/server";
import { recordingAction, recordingUrl } from "@/cms/lessons/classroom";
import type { User } from "@/payload-types";

type Ctx = { params: Promise<{ id: string }> };

/** GET : go to the recording (a short-lived private link). */
export async function GET(req: NextRequest, { params }: Ctx) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user) return fail("Please sign in.", 401);
  try {
    return NextResponse.redirect(await recordingUrl(payload, user, Number((await params).id)), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof BookingError) return fail(err.message, err.status);
    throw err;
  }
}

/** POST { action: "consent" | "decline" | "stop" } */
export async function POST(req: NextRequest, { params }: Ctx) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user) return fail("Please sign in.", 401);
  const b = (await req.json().catch(() => ({}))) as { action?: string };
  if (!["consent", "decline", "stop"].includes(String(b.action))) return fail("Unknown action.");
  try {
    return NextResponse.json(await recordingAction(payload, user, Number((await params).id), b.action as "consent" | "decline" | "stop"));
  } catch (err) {
    if (err instanceof BookingError) return fail(err.message, err.status);
    payload.logger.error({ err }, "[recording]");
    return fail("Something went wrong with recording.", 500);
  }
}

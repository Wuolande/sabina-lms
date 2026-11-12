import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { actOnBooking, BookingError, type BookingAction } from "@/cms/scheduling/server";
import type { User } from "@/payload-types";

const ACTIONS: BookingAction[] = ["accept", "decline", "cancel"];

/** POST { action: accept | decline | cancel, reason? } : the student or tutor acts on a booking. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user) return fail("Please sign in.", 401);
  const body = (await req.json().catch(() => ({}))) as { action?: string; reason?: string };
  if (!ACTIONS.includes(body.action as BookingAction)) return fail("Unknown action.");
  try {
    const b = await actOnBooking(payload, user, Number((await params).id), body.action as BookingAction, body.reason);
    return NextResponse.json({ success: true, status: b.status });
  } catch (err) {
    if (err instanceof BookingError) return fail(err.message, err.status);
    payload.logger.error({ err }, "[bookings] action failed");
    return fail("Something went wrong. Please try again.", 500);
  }
}

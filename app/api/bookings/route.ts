import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { BookingError, createBooking } from "@/cms/scheduling/server";
import { enabledProviders } from "@/cms/payments/providers";
import type { User } from "@/payload-types";

/** POST { tutorId, startsAt, kind, minutes, subjectId?, note?, timezone? } : book a lesson (students). */
export async function POST(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user) return fail("Please sign in to book.", 401);
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const booking = await createBooking(payload, user, {
      tutorId: Number(b.tutorId),
      startsAt: String(b.startsAt ?? ""),
      kind: b.kind === "trial" ? "trial" : "regular",
      minutes: Number(b.minutes),
      subjectId: b.subjectId ? Number(b.subjectId) : null,
      note: typeof b.note === "string" ? b.note : undefined,
      timezone: typeof b.timezone === "string" ? b.timezone : undefined,
    });
    return NextResponse.json({ success: true, booking: { id: booking.id, reference: booking.reference, status: booking.status, startsAt: booking.startsAt, endsAt: booking.endsAt, holdUntil: booking.holdUntil, price: booking.price, currency: booking.currency }, providers: enabledProviders() }, { status: 201 });
  } catch (err) {
    if (err instanceof BookingError) return fail(err.message, err.status);
    payload.logger.error({ err }, "[bookings] create failed");
    return fail("We couldn't book that lesson. Please try again.", 500);
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { refreshPayment } from "@/cms/payments/server";
import type { Booking, User } from "@/payload-types";

/** GET: where a payment stands (the student's own), checking with the provider while pending. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ ref: string }> }) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user) return fail("Please sign in.", 401);
  const found = await payload.find({ collection: "payments", where: { and: [{ reference: { equals: (await params).ref } }, { student: { equals: user.id } }] }, limit: 1, depth: 0, overrideAccess: true });
  if (!found.docs[0]) return fail("Payment not found.", 404);
  const p = await refreshPayment(payload, found.docs[0]);
  const b = (await payload.findByID({ collection: "bookings", id: typeof p.booking === "object" ? p.booking.id : p.booking, depth: 1, overrideAccess: true })) as Booking;
  return NextResponse.json(
    {
      payment: { reference: p.reference, status: p.status, amount: p.amount, currency: p.currency, refunded: p.refundedAmount ?? 0, id: p.id },
      booking: { id: b.id, reference: b.reference, status: b.status, paymentStatus: b.paymentStatus, startsAt: b.startsAt, endsAt: b.endsAt, holdUntil: b.holdUntil ?? null, tutor: typeof b.tutor === "object" ? b.tutor.displayName : null, tutorSlug: typeof b.tutor === "object" ? b.tutor.slug : null },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

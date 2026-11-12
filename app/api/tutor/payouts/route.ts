import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { BookingError } from "@/cms/scheduling/server";
import { requestPayout } from "@/cms/payments/server";
import type { User } from "@/payload-types";

/** POST: withdraw everything available. */
export async function POST(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (user?.role !== "tutor") return fail("Tutors only.", 403);
  try {
    const p = await requestPayout(payload, user);
    return NextResponse.json({ success: true, payout: { reference: p.reference, amount: p.amount, currency: p.currency } }, { status: 201 });
  } catch (err) {
    if (err instanceof BookingError) return fail(err.message, err.status);
    payload.logger.error({ err }, "[payouts] request failed");
    return fail("We couldn't request the payout.", 500);
  }
}

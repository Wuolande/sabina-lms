import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { BookingError } from "@/cms/scheduling/server";
import { startCheckout } from "@/cms/payments/server";
import type { ProviderId } from "@/cms/payments/providers";
import type { User } from "@/payload-types";

/** POST { bookingId, provider } → { url } to send the student to the provider's checkout. */
export async function POST(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user) return fail("Please sign in.", 401);
  const b = (await req.json().catch(() => ({}))) as { bookingId?: unknown; provider?: unknown };
  try {
    return NextResponse.json(await startCheckout(payload, user, Number(b.bookingId), String(b.provider) as ProviderId));
  } catch (err) {
    if (err instanceof BookingError) return fail(err.message, err.status);
    payload.logger.error({ err }, "[payments] checkout");
    return fail("We couldn't start the payment.", 500);
  }
}

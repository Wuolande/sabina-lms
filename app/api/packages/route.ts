import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { BookingError } from "@/cms/scheduling/server";
import { createPackage, studentPackages } from "@/cms/packages/server";
import type { User } from "@/payload-types";

/** GET: the student's packages. */
export async function GET(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user) return fail("Please sign in.", 401);
  return NextResponse.json({ packages: await studentPackages(payload, user) }, { headers: { "Cache-Control": "no-store" } });
}

/** POST { tutorId, lessons, minutes } : start buying a package; then pay at /checkout/package/:id. */
export async function POST(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user) return fail("Please sign in to buy lessons.", 401);
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const k = await createPackage(payload, user, { tutorId: Number(b.tutorId), lessons: Number(b.lessons), minutes: Number(b.minutes) });
    return NextResponse.json({ id: k.id, reference: k.reference, price: k.price, currency: k.currency }, { status: 201 });
  } catch (err) {
    if (err instanceof BookingError) return fail(err.message, err.status);
    payload.logger.error({ err }, "[packages] create failed");
    return fail("We couldn't set up that package. Please try again.", 500);
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { bookingOptions, getPolicies, openSlots } from "@/cms/scheduling/server";
import type { User } from "@/payload-types";

/**
 * GET /api/tutors/:slug/slots?minutes=60 : open start times (UTC ISO) and lesson options.
 * Signed-in students also get their own lessons blocked out and their trial eligibility.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const payload = await getPayloadClient();
  const { slug } = await params;
  const res = await payload.find({ collection: "tutor-profiles", where: { and: [{ slug: { equals: slug } }, { status: { equals: "approved" } }] }, limit: 1, depth: 0, overrideAccess: true });
  const tutor = res.docs[0];
  if (!tutor) return NextResponse.json({ error: "Tutor not found." }, { status: 404 });
  const { user } = (await payload.auth({ headers: req.headers }).catch(() => ({ user: null }))) as { user: User | null };
  const studentId = user?.role === "student" ? user.id : null;
  const policies = await getPolicies(payload);
  const options = await bookingOptions(payload, tutor, policies, studentId);
  const asked = Number(req.nextUrl.searchParams.get("minutes"));
  const minutes = options.some((o) => o.minutes === asked) ? asked : (options[0]?.minutes ?? 60);
  const { slots, timezone, hasHours, instant } = await openSlots(payload, tutor, minutes, policies, studentId);
  return NextResponse.json(
    { minutes, options, slots: slots.map((t) => new Date(t).toISOString()), tutorTimezone: timezone, hasHours, instant, currency: policies.currency, windowDays: policies.bookingWindowDays },
    { headers: { "Cache-Control": "no-store" } },
  );
}

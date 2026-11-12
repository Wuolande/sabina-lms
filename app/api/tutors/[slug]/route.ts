import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { getTutorBySlug } from "@/cms/marketplace/public";

/** GET /api/tutors/:slug : one approved tutor's public profile. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const data = await getTutorBySlug(await getPayloadClient(), (await params).slug);
  if (!data) return NextResponse.json({ error: "Tutor not found." }, { status: 404 });
  return NextResponse.json({ tutor: data.tutor, currency: data.policies.currency });
}

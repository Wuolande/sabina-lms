import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { searchTutors, type SearchParams } from "@/cms/marketplace/public";

/** GET /api/tutors?q=&subject=&level=&language=&min=&max=&trial=1&sort=&page= : public tutor search. */
export async function GET(req: NextRequest) {
  const sp = Object.fromEntries(req.nextUrl.searchParams.entries()) as SearchParams;
  const { tutors, total, page, pages, policies } = await searchTutors(await getPayloadClient(), sp);
  return NextResponse.json({ tutors, total, page, pages, currency: policies.currency }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}

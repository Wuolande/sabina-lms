import { NextResponse } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { subjectsWithCounts } from "@/cms/marketplace/public";

/** GET /api/subjects : active subjects with tutor counts. */
export async function GET() {
  return NextResponse.json(await subjectsWithCounts(await getPayloadClient()), { headers: { "Cache-Control": "public, max-age=300" } });
}

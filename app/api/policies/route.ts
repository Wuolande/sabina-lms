import { NextResponse } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { getPolicies } from "@/cms/tutors/server";

/** GET /api/policies : public fees and booking policies (Settings › Fees & policies). */
export async function GET() {
  return NextResponse.json(await getPolicies(await getPayloadClient()), { headers: { "Cache-Control": "public, max-age=300" } });
}

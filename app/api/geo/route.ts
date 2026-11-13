import { NextResponse } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { geoLists } from "@/cms/geo/server";

/** Countries and time zones for every picker on the site and in the admin. */
export async function GET() {
  const data = await geoLists(await getPayloadClient());
  return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } });
}

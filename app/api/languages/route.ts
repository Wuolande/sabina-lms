import { NextResponse } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";

/** GET /api/languages : active languages. */
export async function GET() {
  const payload = await getPayloadClient();
  const res = await payload.find({ collection: "languages", where: { isActive: { equals: true } }, sort: "name", limit: 300, depth: 0, pagination: false });
  return NextResponse.json(res.docs.map((l) => ({ id: l.id, name: l.name, code: l.code, nativeName: l.nativeName })), { headers: { "Cache-Control": "public, max-age=300" } });
}

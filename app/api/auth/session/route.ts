import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient, homeFor } from "@/cms/auth/session";
import { publicUser } from "@/cms/auth/http";

/** GET /api/auth/session: who is signed in. */
export async function GET(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: req.headers });
  // Not being signed in is a normal answer, not an error.
  if (!user) return NextResponse.json({ authenticated: false, user: null }, { headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ authenticated: true, user: publicUser(user), home: homeFor((user as { role?: string }).role) });
}

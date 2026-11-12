import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient, homeFor } from "@/cms/auth/session";
import { publicUser } from "@/cms/auth/http";

/** GET /api/auth/session: who is signed in. */
export async function GET(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, user: publicUser(user), home: homeFor((user as { role?: string }).role) });
}

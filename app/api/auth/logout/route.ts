import { NextResponse, type NextRequest } from "next/server";
import { createLocalReq, logoutOperation } from "payload";
import { getPayloadClient } from "@/cms/auth/session";
import { clearSessionCookie } from "@/cms/auth/http";

/** POST /api/auth/logout: end this session on the server and clear the cookie. */
export async function POST(req: NextRequest) {
  const payload = await getPayloadClient();
  try {
    const { user } = await payload.auth({ headers: req.headers });
    if (user) {
      const localReq = await createLocalReq({ user }, payload);
      localReq.headers = req.headers;
      await logoutOperation({ collection: payload.collections.users, req: localReq });
    }
  } catch {
    /* already signed out */
  }
  return clearSessionCookie(NextResponse.json({ success: true }), payload);
}

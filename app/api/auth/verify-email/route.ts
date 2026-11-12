import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail, guard } from "@/cms/auth/http";

/** POST /api/auth/verify-email { token }: confirm an email address from the link we sent. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const blocked = guard(req, body, "verify", { maxAttempts: 20, windowMs: 10 * 60_000 });
  if (blocked) return blocked;
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) return fail("This confirmation link is incomplete.");

  const payload = await getPayloadClient();
  try {
    await payload.verifyEmail({ collection: "users", token });
    return NextResponse.json({ success: true });
  } catch {
    return fail("This confirmation link has expired or was already used. Sign in, or ask for a new link.", 400, { code: "INVALID_TOKEN" });
  }
}

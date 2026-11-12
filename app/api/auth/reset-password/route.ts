import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient, homeFor } from "@/cms/auth/session";
import { fail, guard, passwordProblem, publicUser, withSessionCookie } from "@/cms/auth/http";

/** POST /api/auth/reset-password { token, password }: set a new password and sign the person in. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const blocked = guard(req, body, "reset", { maxAttempts: 10, windowMs: 15 * 60_000 });
  if (blocked) return blocked;
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) return fail("This reset link is incomplete. Ask for a new one.");
  const pw = passwordProblem(body.password);
  if (pw) return fail(pw);

  const payload = await getPayloadClient();
  try {
    const result = await payload.resetPassword({ collection: "users", data: { token, password: String(body.password) }, overrideAccess: true });
    const user = result.user as unknown as Parameters<typeof publicUser>[0] & { role?: string };
    const res = NextResponse.json({ success: true, user: publicUser(user), redirectTo: homeFor(user.role) });
    return result.token ? withSessionCookie(res, payload, result.token) : res;
  } catch {
    return fail("This reset link has expired or was already used. Ask for a new one.", 400, { code: "INVALID_TOKEN" });
  }
}

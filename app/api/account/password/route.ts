import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail, guard, passwordProblem } from "@/cms/auth/http";

/** POST /api/account/password { currentPassword, newPassword }: change your own password. */
export async function POST(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) return fail("Please sign in.", 401);

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const blocked = guard(req, body, `pwchange_${user.id}`, { maxAttempts: 5, windowMs: 15 * 60_000, lockoutDurationMs: 15 * 60_000 });
  if (blocked) return blocked;

  const current = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const next = typeof body.newPassword === "string" ? body.newPassword : "";
  if (!current) return fail("Enter your current password.");
  const problem = passwordProblem(next);
  if (problem) return fail(problem);
  if (current === next) return fail("Choose a password that's different from your current one.");

  try {
    await payload.login({ collection: "users", data: { email: user.email, password: current } });
  } catch {
    return fail("Your current password isn't right.", 400);
  }
  await payload.update({ collection: "users", id: user.id, data: { password: next } as never, overrideAccess: true });
  return NextResponse.json({ success: true });
}

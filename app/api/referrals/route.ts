import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { referralSummary } from "@/cms/referrals/server";
import type { User } from "@/payload-types";

/** GET → the signed-in person's invite link, rewards, invited friends and credit history. */
export async function GET(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user) return fail("Please sign in.", 401);
  if (user.role !== "student" && user.role !== "tutor") return fail("Invites are for students and tutors.", 403);
  return NextResponse.json(await referralSummary(payload, user));
}

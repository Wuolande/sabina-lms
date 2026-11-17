import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { getPolicies } from "@/cms/tutors/server";
import { usableCredit } from "@/cms/payments/server";
import type { User } from "@/payload-types";

/** GET → lesson credit the student can use at checkout now. */
export async function GET(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user) return fail("Please sign in.", 401);
  const currency = String((await getPolicies(payload)).currency);
  return NextResponse.json({ balance: user.role === "student" ? await usableCredit(payload, user.id, currency) : 0, currency });
}

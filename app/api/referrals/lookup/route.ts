import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { getPolicies } from "@/cms/tutors/server";
import { userByCode } from "@/cms/referrals/server";

/** GET ?code= → who sent this invite (first name only) and the welcome credit, for the sign-up page. */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") ?? "";
  const payload = await getPayloadClient();
  const policies = await getPolicies(payload);
  const by = policies.referralsEnabled ? await userByCode(payload, code) : null;
  if (!by) return NextResponse.json({ found: false });
  return NextResponse.json({ found: true, name: by.firstName ?? "A friend", welcome: Number(policies.referralRewardFriend), currency: String(policies.currency) });
}

import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { createShare, revokeShare } from "@/cms/progress/server";
import type { User } from "@/payload-types";

/** POST : create (or replace) the private parent link. DELETE : turn it off. */
export async function POST(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user || user.role !== "student") return fail("Please sign in as a student.", 401);
  const token = await createShare(payload, user);
  return NextResponse.json({ path: `/progress/${token}` });
}

export async function DELETE(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user || user.role !== "student") return fail("Please sign in as a student.", 401);
  await revokeShare(payload, user);
  return NextResponse.json({ success: true });
}

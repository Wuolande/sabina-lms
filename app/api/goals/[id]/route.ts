import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { BookingError } from "@/cms/scheduling/server";
import { updateGoal } from "@/cms/progress/server";
import type { User } from "@/payload-types";

/** PATCH { title?, targetDate?, milestones?, status? } */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user) return fail("Please sign in.", 401);
  try {
    return NextResponse.json(await updateGoal(payload, user, Number((await params).id), (await req.json().catch(() => ({}))) as Parameters<typeof updateGoal>[3]));
  } catch (err) {
    if (err instanceof BookingError) return fail(err.message, err.status);
    throw err;
  }
}

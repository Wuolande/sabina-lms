import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { BookingError } from "@/cms/scheduling/server";
import { createGoal, listGoals } from "@/cms/progress/server";
import type { User } from "@/payload-types";

/** GET [?student=] : a student's goals (their own, or a tutor's student's). */
export async function GET(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user) return fail("Please sign in.", 401);
  try {
    return NextResponse.json({ goals: await listGoals(payload, user, Number(req.nextUrl.searchParams.get("student")) || user.id) });
  } catch (err) {
    if (err instanceof BookingError) return fail(err.message, err.status);
    throw err;
  }
}

/** POST { studentId?, title, targetDate?, milestones? } */
export async function POST(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user) return fail("Please sign in.", 401);
  const b = (await req.json().catch(() => ({}))) as { studentId?: number } & Parameters<typeof createGoal>[3];
  try {
    return NextResponse.json(await createGoal(payload, user, Number(b.studentId) || user.id, b), { status: 201 });
  } catch (err) {
    if (err instanceof BookingError) return fail(err.message, err.status);
    throw err;
  }
}

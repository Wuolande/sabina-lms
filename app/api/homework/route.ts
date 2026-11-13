import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { BookingError } from "@/cms/scheduling/server";
import { createAssignment, listAssignments } from "@/cms/progress/server";
import type { User } from "@/payload-types";

async function me(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  return { payload, user };
}

/** GET [?student=] : homework and quizzes (the student's own, or the tutor's). */
export async function GET(req: NextRequest) {
  const { payload, user } = await me(req);
  if (!user) return fail("Please sign in.", 401);
  const student = Number(req.nextUrl.searchParams.get("student")) || undefined;
  return NextResponse.json({ items: await listAssignments(payload, user, { studentId: student }) }, { headers: { "Cache-Control": "no-store" } });
}

/** POST { studentId, kind, title, instructions, dueAt?, lessonId?, questions? } : tutors set homework or a quiz. */
export async function POST(req: NextRequest) {
  const { payload, user } = await me(req);
  if (!user) return fail("Please sign in.", 401);
  const b = (await req.json().catch(() => ({}))) as Parameters<typeof createAssignment>[2];
  try {
    const a = await createAssignment(payload, user, b);
    return NextResponse.json({ id: a.id }, { status: 201 });
  } catch (err) {
    if (err instanceof BookingError) return fail(err.message, err.status);
    payload.logger.error({ err }, "[homework] create failed");
    return fail("We couldn't save that. Please try again.", 500);
  }
}

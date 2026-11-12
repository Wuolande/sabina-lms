import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { BookingError } from "@/cms/scheduling/server";
import { finishLesson, joinLesson, reportProblem, submitReview } from "@/cms/lessons/server";
import type { User } from "@/payload-types";

/**
 * POST { action } for a lesson the caller is part of:
 *  join                      → LiveKit token for the classroom
 *  finish   { notes }        → tutor marks the lesson done (notes go to the student)
 *  report   { text }         → either side reports a problem
 *  review   { rating, comment } → student reviews a finished lesson
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user) return fail("Please sign in.", 401);
  const id = Number((await params).id);
  const b = (await req.json().catch(() => ({}))) as { action?: string; notes?: string; text?: string; rating?: number; comment?: string };
  try {
    switch (b.action) {
      case "join":
        return NextResponse.json(await joinLesson(payload, user, id), { headers: { "Cache-Control": "no-store" } });
      case "finish":
        await finishLesson(payload, user, id, String(b.notes ?? ""));
        return NextResponse.json({ success: true });
      case "report":
        await reportProblem(payload, user, id, String(b.text ?? ""));
        return NextResponse.json({ success: true });
      case "review":
        await submitReview(payload, user, id, Number(b.rating), String(b.comment ?? ""));
        return NextResponse.json({ success: true }, { status: 201 });
      default:
        return fail("Unknown action.");
    }
  } catch (err) {
    if (err instanceof BookingError) return fail(err.message, err.status);
    payload.logger.error({ err }, "[lessons] action failed");
    return fail("Something went wrong. Please try again.", 500);
  }
}

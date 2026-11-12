import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/cms/auth/api";
import { fail } from "@/cms/auth/http";
import { completeLesson, submitQuiz } from "@/cms/academy/server";

/** POST { action: "complete", lesson } or { action: "quiz", answers: number[] } (answers are 1-based). */
export const POST = (req: NextRequest, { params }: { params: Promise<{ slug: string }> }) =>
  withUser(req, "academy", async (payload, user) => {
    if (user.role !== "tutor") return fail("The academy is for tutors.", 403);
    const slug = (await params).slug;
    const b = (await req.json().catch(() => ({}))) as { action?: string; lesson?: string; answers?: number[] };
    if (b.action === "complete") return NextResponse.json(await completeLesson(payload, user, slug, String(b.lesson ?? "")));
    if (b.action === "quiz") return NextResponse.json(await submitQuiz(payload, user, slug, (b.answers ?? []).map(Number)));
    return fail("Unknown action.");
  });

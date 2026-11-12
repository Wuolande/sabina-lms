import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { BookingError } from "@/cms/scheduling/server";
import { replyToReview } from "@/cms/lessons/server";
import type { User } from "@/payload-types";

/** POST { reply } : the tutor answers a review publicly (empty removes the reply). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (user?.role !== "tutor") return fail("Tutors only.", 403);
  const b = (await req.json().catch(() => ({}))) as { reply?: string };
  try {
    await replyToReview(payload, user, Number((await params).id), String(b.reply ?? ""));
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof BookingError) return fail(err.message, err.status);
    return fail("Something went wrong.", 500);
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { BookingError } from "@/cms/scheduling/server";
import { deleteAssignment, getAssignment, reviewAssignment, submitAssignment } from "@/cms/progress/server";
import type { User } from "@/payload-types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user) return fail("Please sign in.", 401);
  const a = await getAssignment(payload, user, Number((await params).id));
  return a ? NextResponse.json(a, { headers: { "Cache-Control": "no-store" } }) : fail("Not found.", 404);
}

/** POST { action: "submit", answer?, files?, responses? } (student) | { action: "review", feedback } (tutor). */
export async function POST(req: NextRequest, { params }: Ctx) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user) return fail("Please sign in.", 401);
  const id = Number((await params).id);
  const b = (await req.json().catch(() => ({}))) as { action?: string; answer?: unknown; files?: unknown[]; responses?: unknown[]; feedback?: unknown };
  try {
    if (b.action === "submit") return NextResponse.json(await submitAssignment(payload, user, id, b));
    if (b.action === "review") return NextResponse.json(await reviewAssignment(payload, user, id, b));
    return fail("Unknown action.");
  } catch (err) {
    if (err instanceof BookingError) return fail(err.message, err.status);
    payload.logger.error({ err }, "[homework] action failed");
    return fail("That didn't work. Please try again.", 500);
  }
}

/** DELETE : the tutor removes homework nobody has handed in yet. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user) return fail("Please sign in.", 401);
  try {
    await deleteAssignment(payload, user, Number((await params).id));
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof BookingError) return fail(err.message, err.status);
    throw err;
  }
}

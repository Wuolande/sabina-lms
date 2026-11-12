import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { idList, ownStudentProfile } from "@/cms/students/server";
import type { User } from "@/payload-types";

async function student(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  return { payload, user: user?.role === "student" ? user : null };
}

/** POST { tutorId }: save a tutor. */
export async function POST(req: NextRequest) {
  const { payload, user } = await student(req);
  if (!user) return fail("Only students can save tutors.", 403);
  const tutorId = Number(((await req.json().catch(() => ({}))) as { tutorId?: unknown }).tutorId);
  if (!tutorId) return fail("Missing tutor.");
  const tutor = await payload.find({ collection: "tutor-profiles", where: { and: [{ id: { equals: tutorId } }, { status: { equals: "approved" } }] }, limit: 1, depth: 0, overrideAccess: false });
  if (!tutor.docs[0]) return fail("Tutor not found.", 404);
  const profile = await ownStudentProfile(payload, user);
  const saved = idList(profile.savedTutors);
  if (!saved.includes(tutorId)) await payload.update({ collection: "student-profiles", id: profile.id, data: { savedTutors: [tutorId, ...saved].slice(0, 200) }, overrideAccess: true });
  return NextResponse.json({ success: true, saved: true });
}

/** DELETE { tutorId }: unsave a tutor. */
export async function DELETE(req: NextRequest) {
  const { payload, user } = await student(req);
  if (!user) return fail("Only students can save tutors.", 403);
  const tutorId = Number(((await req.json().catch(() => ({}))) as { tutorId?: unknown }).tutorId);
  const profile = await ownStudentProfile(payload, user);
  await payload.update({ collection: "student-profiles", id: profile.id, data: { savedTutors: idList(profile.savedTutors).filter((id) => id !== tutorId) }, overrideAccess: true });
  return NextResponse.json({ success: true, saved: false });
}

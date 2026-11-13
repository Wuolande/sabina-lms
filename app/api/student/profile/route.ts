import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { idList, ownStudentProfile } from "@/cms/students/server";
import { STUDENT_GOALS, STUDENT_LEVELS, STUDENT_PACE } from "@/cms/collections/StudentProfiles";
import type { StudentProfile, User } from "@/payload-types";
import { toSafeLexical, type Lexical } from "@/cms/content/rich";

const pick = <T extends { value: string }>(list: readonly T[], v: unknown) => (list.some((o) => o.value === v) ? (v as string) : null);
const serialize = (p: StudentProfile) => ({
  subjects: idList(p.subjects),
  goal: p.goal ?? null,
  level: p.level ?? null,
  pace: p.pace ?? null,
  budgetMin: p.budgetMin ?? null,
  budgetMax: p.budgetMax ?? null,
  goalDetails: (p.goalDetails as Lexical | null) ?? null,
  preferredLanguages: idList(p.preferredLanguages),
  onboardedAt: p.onboardedAt ?? null,
});

async function student(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  return { payload, user: user?.role === "student" ? user : null };
}

/** GET /api/student/profile: learning goals. */
export async function GET(req: NextRequest) {
  const { payload, user } = await student(req);
  if (!user) return fail("Only students can do this.", 403);
  return NextResponse.json({ profile: serialize(await ownStudentProfile(payload, user)) });
}

/** PATCH /api/student/profile: update learning goals. */
export async function PATCH(req: NextRequest) {
  const { payload, user } = await student(req);
  if (!user) return fail("Only students can do this.", 403);
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const profile = await ownStudentProfile(payload, user);
  const num = (v: unknown) => (v === null || v === "" || v === undefined ? null : Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.round(Number(v)) : null);
  const data: Record<string, unknown> = { onboardedAt: profile.onboardedAt ?? new Date().toISOString() };
  if (Array.isArray(b.subjects)) data.subjects = b.subjects.map(Number).filter(Boolean).slice(0, 10);
  if (b.goal !== undefined) data.goal = pick(STUDENT_GOALS, b.goal);
  if (b.level !== undefined) data.level = pick(STUDENT_LEVELS, b.level);
  if (b.pace !== undefined) data.pace = pick(STUDENT_PACE, b.pace);
  if (b.budgetMin !== undefined) data.budgetMin = num(b.budgetMin);
  if (b.budgetMax !== undefined) data.budgetMax = num(b.budgetMax);
  if (data.budgetMin != null && data.budgetMax != null && (data.budgetMin as number) > (data.budgetMax as number)) return fail("The lowest price must be below the highest.");
  if (b.goalDetails !== undefined) {
    try {
      data.goalDetails = toSafeLexical(b.goalDetails, 600, "Your note");
    } catch (e) {
      return fail((e as Error).message);
    }
  }
  if (Array.isArray(b.preferredLanguages)) data.preferredLanguages = b.preferredLanguages.map(Number).filter(Boolean).slice(0, 5);
  const updated = await payload.update({ collection: "student-profiles", id: profile.id, data, overrideAccess: true });
  return NextResponse.json({ profile: serialize(updated) });
}

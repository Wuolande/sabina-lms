import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { findMatches, rememberAnswers, TIMES, type TimeSlot } from "@/cms/matching/server";
import type { User } from "@/payload-types";

/** POST { subjectId, level?, goal?, budget?, times?, languageId?, timezone? } → the best three tutors. */
export async function POST(req: NextRequest) {
  const payload = await getPayloadClient();
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const subjectId = Number(b.subjectId);
  if (!subjectId) return fail("Choose a subject.");
  const answers = {
    subjectId,
    level: typeof b.level === "string" ? b.level : null,
    goal: typeof b.goal === "string" ? b.goal : null,
    budget: Number(b.budget) > 0 ? Math.min(100000, Number(b.budget)) : null,
    times: Array.isArray(b.times) ? (b.times.filter((t) => TIMES.some((x) => x.value === t)) as TimeSlot[]) : [],
    languageId: Number(b.languageId) || null,
    timezone: typeof b.timezone === "string" ? b.timezone : null,
  };
  const result = await findMatches(payload, answers);
  if (!result.subject) return fail("That subject isn't available.", 404);
  const { user } = (await payload.auth({ headers: req.headers }).catch(() => ({ user: null }))) as { user: User | null };
  if (user) await rememberAnswers(payload, user, answers).catch((err) => payload.logger.error({ err }, "[match] remember failed"));
  return NextResponse.json(
    {
      subject: { id: result.subject.id, name: result.subject.name, slug: result.subject.slug },
      total: result.total,
      currency: result.currency,
      matches: result.matches.map((m) => ({
        reasons: m.reasons,
        tutor: { id: m.tutor.id, slug: m.tutor.slug, name: m.tutor.name, headline: m.tutor.headline, photo: m.tutor.photoLarge ?? m.tutor.photo, hourlyRate: m.tutor.hourlyRate, trialPrice: m.tutor.trialPrice, rating: m.tutor.rating, reviewCount: m.tutor.reviewCount, lessonsTaught: m.tutor.lessonsTaught, country: m.tutor.country, verified: m.tutor.verified, isSuperTutor: m.tutor.isSuperTutor },
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

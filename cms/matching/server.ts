import "server-only";
import type { Payload } from "payload";
import type { Language, Subject, User } from "@/payload-types";
import { getPolicies } from "../tutors/server";
import { toPublicTutor, type PublicTutor } from "../marketplace/public";
import { safeTz, toMinutes, tzOffsetMinutes } from "@/lib/time";
import { money } from "@/lib/money";

/** When the student is free, in their own time zone. */
export const TIMES = [
  { value: "mornings", label: "Weekday mornings", sub: "Before 12:00" },
  { value: "afternoons", label: "Weekday afternoons", sub: "12:00 to 17:00" },
  { value: "evenings", label: "Weekday evenings", sub: "After 17:00" },
  { value: "weekends", label: "Weekends", sub: "Saturday and Sunday" },
] as const;
export type TimeSlot = (typeof TIMES)[number]["value"];

/** Who the lessons are for. Same values as the levels tutors teach. */
export const MATCH_LEVELS = [
  { value: "primary", label: "Primary school" },
  { value: "secondary", label: "Secondary / high school" },
  { value: "university", label: "University" },
  { value: "adult", label: "An adult learner" },
] as const;

export const MATCH_GOALS = [
  { value: "exam", label: "Pass an exam" },
  { value: "school", label: "Keep up at school" },
  { value: "career", label: "Career & work" },
  { value: "conversation", label: "Speak with confidence" },
  { value: "hobby", label: "Learn for fun" },
] as const;

export type MatchAnswers = {
  subjectId: number;
  level?: string | null;
  goal?: string | null;
  budget?: number | null;
  times?: TimeSlot[];
  languageId?: number | null;
  timezone?: string | null;
};

export type Match = { tutor: PublicTutor; score: number; reasons: string[] };

const WEEKDAYS = [1, 2, 3, 4, 5];
/** Minutes-of-week windows for each slot: [day, from, to]. */
const WINDOWS: Record<TimeSlot, [number, number, number][]> = {
  mornings: WEEKDAYS.map((d) => [d, 6 * 60, 12 * 60]),
  afternoons: WEEKDAYS.map((d) => [d, 12 * 60, 17 * 60]),
  evenings: WEEKDAYS.map((d) => [d, 17 * 60, 22 * 60]),
  weekends: [0, 6].map((d) => [d, 7 * 60, 21 * 60]),
};

const WEEK = 7 * 24 * 60;
const overlap = (a0: number, a1: number, b0: number, b1: number) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));

/**
 * How many minutes a week of the tutor's hours fall inside each of the student's slots, with the
 * tutor's hours shifted into the student's time zone.
 */
function freeMinutes(weekly: { day: string; start: string; end: string }[], tutorTz: string, studentTz: string) {
  const now = Date.now();
  const shift = tzOffsetMinutes(now, studentTz) - tzOffsetMinutes(now, tutorTz);
  const ranges: [number, number][] = [];
  for (const r of weekly) {
    const s = Number(r.day) * 1440 + toMinutes(r.start) + shift;
    const e = Number(r.day) * 1440 + toMinutes(r.end) + shift;
    // Wrap around the week so Sunday-night hours can count as Monday morning (and back).
    for (const k of [-WEEK, 0, WEEK]) ranges.push([s + k, e + k]);
  }
  const out = {} as Record<TimeSlot, number>;
  for (const slot of Object.keys(WINDOWS) as TimeSlot[]) {
    out[slot] = WINDOWS[slot].reduce((n, [d, f, t]) => n + ranges.reduce((m, [a, b]) => m + overlap(a, b, d * 1440 + f, d * 1440 + t), 0), 0);
  }
  return out;
}

const SLOT_WORDS: Record<TimeSlot, string> = { mornings: "weekday mornings", afternoons: "weekday afternoons", evenings: "weekday evenings", weekends: "weekends" };
const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

/**
 * The best three tutors for a student's answers, with plain reasons for each. Scores reward
 * subject and level fit, budget, matching free time, language, ratings and experience; tutors
 * without open hours drop to the bottom.
 */
export async function findMatches(payload: Payload, a: MatchAnswers) {
  const policies = await getPolicies(payload);
  const subject = (await payload.findByID({ collection: "subjects", id: a.subjectId, depth: 0, overrideAccess: false }).catch(() => null)) as Subject | null;
  if (!subject) return { subject: null, matches: [] as Match[], total: 0 };
  const language = a.languageId ? ((await payload.findByID({ collection: "languages", id: a.languageId, depth: 0 }).catch(() => null)) as Language | null) : null;
  const studentTz = safeTz(a.timezone);
  const times = (a.times ?? []).filter((t): t is TimeSlot => t in WINDOWS);

  const found = await payload.find({
    collection: "tutor-profiles",
    where: { and: [{ status: { equals: "approved" } }, { subjects: { in: [subject.id] } }] },
    limit: 300,
    depth: 1,
    // Server-side only: the tutor's account link is needed to read their hours. Only public
    // fields (toPublicTutor) ever leave this function.
    overrideAccess: true,
    pagination: false,
  });
  const seen = new Set<number>();
  const docs = found.docs.filter((t) => !seen.has(t.id) && seen.add(t.id));
  const userOf = (t: (typeof docs)[number]) => (t.user && typeof t.user === "object" ? t.user.id : Number(t.user));
  const userIds = docs.map(userOf).filter((n) => Number.isFinite(n));
  const schedules = userIds.length
    ? (await payload.find({ collection: "schedules", where: { user: { in: userIds } }, limit: 300, depth: 0, overrideAccess: true, pagination: false })).docs
    : [];
  const byUser = new Map(schedules.map((s) => [typeof s.user === "object" ? s.user.id : s.user, s]));

  const matches: Match[] = docs.map((t) => {
    const pub = toPublicTutor(t, policies);
    const reasons: string[] = [];
    let score = 0;

    if (pub.primarySubject?.id === subject.id) {
      score += 12;
      reasons.push(`${subject.name} is their main subject`);
    } else score += 6;

    if (a.level && pub.levelsTaught.includes(a.level)) {
      score += 15;
      const lvl = MATCH_LEVELS.find((l) => l.value === a.level)?.label.toLowerCase();
      if (lvl && a.level !== "adult") reasons.push(`Teaches ${lvl} students`);
      else if (a.level === "adult") reasons.push("Teaches adult learners");
    } else if (a.level) score -= 6;
    if (a.goal === "exam" && pub.levelsTaught.includes("exam")) {
      score += 10;
      reasons.push("Prepares students for exams");
    }

    if (a.budget) {
      if (pub.hourlyRate <= a.budget) {
        score += 15;
        reasons.push(`${money(pub.hourlyRate, policies.currency)} an hour, within your budget`);
      } else if (pub.hourlyRate <= a.budget * 1.2) score += 3;
      else score -= 25;
    }

    const sch = byUser.get(userOf(t));
    const weekly = (sch?.weekly ?? []) as { day: string; start: string; end: string }[];
    if (!weekly.length) score -= 30;
    else if (times.length) {
      const free = freeMinutes(weekly, safeTz(sch?.timezone), studentTz);
      const fits = times.filter((s) => free[s] >= 120);
      score += Math.round((18 * fits.length) / times.length);
      if (fits.length) reasons.push(`Free on ${list(fits.map((s) => SLOT_WORDS[s]))}`);
    } else score += 6;

    if (language) {
      if (pub.languages.some((l) => l.name === language.name)) {
        score += 10;
        if (language.code !== "en") reasons.push(`Speaks ${language.name}`);
      } else score -= 8;
    }

    if (pub.reviewCount > 0) {
      score += Math.round(pub.rating * 4 * Math.min(1, 0.4 + pub.reviewCount / 10));
      if (pub.rating >= 4.5) reasons.push(`Rated ${pub.rating.toFixed(1)} by ${pub.reviewCount} ${pub.reviewCount === 1 ? "student" : "students"}`);
    } else score += 8;
    score += Math.min(10, Math.round(Math.log2(pub.lessonsTaught + 1) * 2));
    if (pub.isSuperTutor) score += 5;
    if (pub.verified) score += 3;
    if (pub.trialPrice != null) {
      score += 4;
      reasons.push(`Trial lesson for ${money(pub.trialPrice, policies.currency)}`);
    }
    if (pub.introVideoUrl) score += 2;
    return { tutor: pub, score, reasons: reasons.slice(0, 4) };
  });

  matches.sort((x, y) => y.score - x.score || y.tutor.rating - x.tutor.rating);
  return { subject, matches: matches.slice(0, 3), total: matches.length, currency: policies.currency };
}

/** Signed-in students: remember the answers in their learning goals, without overwriting choices. */
export async function rememberAnswers(payload: Payload, user: User, a: MatchAnswers) {
  if (user.role !== "student") return;
  const found = await payload.find({ collection: "student-profiles", where: { user: { equals: user.id } }, limit: 1, depth: 0, overrideAccess: true });
  const p = found.docs[0];
  const ids = (xs: unknown[] | null | undefined) => (xs ?? []).map((x) => (typeof x === "object" && x ? (x as { id: number }).id : Number(x)));
  const subjects = Array.from(new Set([...ids(p?.subjects), a.subjectId]));
  const languages = a.languageId ? Array.from(new Set([...ids(p?.preferredLanguages), a.languageId])) : ids(p?.preferredLanguages);
  const data = {
    subjects,
    preferredLanguages: languages,
    ...(a.goal && !p?.goal ? { goal: a.goal } : {}),
    ...(a.budget && !p?.budgetMax ? { budgetMax: a.budget } : {}),
  };
  if (p) await payload.update({ collection: "student-profiles", id: p.id, data: data as never, overrideAccess: true });
  else await payload.create({ collection: "student-profiles", data: { user: user.id, ...data } as never, overrideAccess: true });
}

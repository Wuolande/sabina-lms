/**
 * Demo data: realistic tutors, students, lessons, reviews, payments, messages, homework and site
 * traffic, so the platform feels lived-in for demos. Loaded and removed from Admin › Demo data.
 *
 * Every demo account uses an @demo.sabinaedge.com email (see demo-domain.ts); everything else
 * hangs off those accounts, so removing them removes it all. Emails to demo addresses are never
 * sent, and demo tutors can't be paid (see payments/server.ts).
 *
 * Loading runs in small steps (the admin page calls them one after another) so each request stays
 * well inside the hosting time limit.
 */
import { randomBytes } from "node:crypto";
import type { Payload } from "payload";
import { sql } from "@payloadcms/db-postgres";
import type { User } from "@/payload-types";
import { textToLexical } from "../content/rich";
import { slugify } from "../fields/slug";
import { HIGHLIGHTS } from "../reviews/highlights";
import { DEMO_DOMAIN } from "./demo-domain";
import { DEMO_APPLICANTS, DEMO_TUTORS, type DemoTutor } from "./demo-tutors";
import { DEMO_STUDENTS, GOALS, HOMEWORK, LESSON_NOTES, REPLIES, REVIEWS, THREADS } from "./demo-people";

export { DEMO_DOMAIN, isDemoEmail } from "./demo-domain";

const TUTORS_PER_STEP = 3;
const STUDENTS_PER_STEP = 21;
const DAY = 86_400_000;

type Row = Record<string, unknown>;
async function rows(payload: Payload, q: ReturnType<typeof sql>): Promise<Row[]> {
  const r = (await payload.db.drizzle.execute(q)) as unknown as { rows?: Row[] } | Row[];
  return Array.isArray(r) ? r : (r.rows ?? []);
}
const like = `%@${DEMO_DOMAIN}`;

/* ------------------------------------------------------------------ helpers */

/** Small seeded random generator, so the same tutor always gets the same history. */
function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T,>(list: readonly T[]) => list[Math.floor(next() * list.length)],
    chance: (p: number) => next() < p,
    shuffle: <T,>(list: readonly T[]) => [...list].map((v) => [next(), v] as const).sort((x, y) => x[0] - y[0]).map(([, v]) => v),
  };
}
type Rng = ReturnType<typeof rng>;

/** Minutes the zone is ahead of UTC at that moment. */
function tzOffset(tz: string, at: Date) {
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(at).map((x) => [x.type, x.value]));
    return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - Math.floor(at.getTime() / 60000) * 60000) / 60000;
  } catch {
    return 0;
  }
}
/** The UTC moment of `hour:00` local time, `daysFromToday` days from today in that zone. */
function localTime(tz: string, daysFromToday: number, hour: number, minute = 0) {
  const base = new Date(Date.now() + daysFromToday * DAY);
  const guess = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), hour, minute));
  return new Date(guess.getTime() - tzOffset(tz, guess) * 60000);
}
const weekdayIn = (tz: string, d: Date) => new Date(d.getTime() + tzOffset(tz, d) * 60000).getUTCDay();
const fill = (text: string, v: Record<string, string>) => text.replace(/\{(\w)\}/g, (_, k: string) => v[k] ?? "");
/** Array rows written straight to the database need their own id. */
const rid = () => randomBytes(12).toString("hex");
const iso = (d: Date | number) => new Date(d).toISOString();
const ref = (prefix: string) => `${prefix}-${randomBytes(4).toString("hex").toUpperCase().slice(0, 7)}`;
const email = (first: string, last: string, tag: string) => `${slugify(`${first}.${last}`)}.${tag}@${DEMO_DOMAIN}`.toLowerCase();

/** Weekly hours: afternoons and evenings on weekdays, mornings on Saturday, varied per tutor. */
function weeklyHours(r: Rng) {
  const start = r.pick([14, 15, 16]);
  const end = r.pick([19, 20, 21]);
  const days = r.shuffle([1, 2, 3, 4, 5]).slice(0, r.int(3, 5));
  const w = days.map((d) => ({ day: String(d), start: `${start}:00`, end: `${end}:00` }));
  if (r.chance(0.7)) w.push({ day: "6", start: "09:00", end: r.pick(["12:00", "13:00", "14:00"]) });
  if (r.chance(0.3)) w.push({ day: "0", start: "15:00", end: "18:00" });
  return w;
}
/** A free hour inside the tutor's weekly hours on that day, or null. */
function slotOn(tz: string, weekly: { day: string; start: string; end: string }[], days: number, taken: Set<string>, r: Rng) {
  const probe = localTime(tz, days, 12);
  const ranges = weekly.filter((w) => +w.day === weekdayIn(tz, probe));
  if (!ranges.length) return null;
  const w = r.pick(ranges);
  const hours = Array.from({ length: parseInt(w.end) - parseInt(w.start) }, (_, i) => parseInt(w.start) + i);
  for (const h of r.shuffle(hours)) {
    const key = `${days}:${h}`;
    if (!taken.has(key)) {
      taken.add(key);
      return localTime(tz, days, h);
    }
  }
  return null;
}

async function lookups(payload: Payload) {
  const [subjects, languages, policies] = await Promise.all([
    payload.find({ collection: "subjects", limit: 500, pagination: false, depth: 0, overrideAccess: true }),
    payload.find({ collection: "languages", limit: 500, pagination: false, depth: 0, overrideAccess: true }),
    (await import("../tutors/server")).getPolicies(payload),
  ]);
  return {
    subject: new Map(subjects.docs.map((s) => [s.name, s.id])),
    language: new Map(languages.docs.map((l) => [l.name, l.id])),
    currency: String(policies.currency ?? "USD"),
    fee: Number(policies.platformFeePercent ?? 20),
    trialMinutes: Number(policies.trialLessonMinutes ?? 30),
    trialDiscount: Number(policies.trialLessonDiscountPercent ?? 30),
  };
}

async function createUser(payload: Payload, admin: User, p: { first: string; last: string; role: "tutor" | "student"; country: string; tz: string; tag: string; joinedDaysAgo: number }) {
  const u = await payload.create({
    collection: "users",
    data: { email: email(p.first, p.last, p.tag), password: randomBytes(18).toString("base64url"), firstName: p.first, lastName: p.last, role: p.role, country: p.country, timezone: p.tz, status: "active", _verified: true } as never,
    overrideAccess: true,
    user: admin,
    disableVerificationEmail: true,
    context: { skipAudit: true },
  });
  const at = iso(Date.now() - p.joinedDaysAgo * DAY);
  await payload.db.updateOne({ collection: "users", id: u.id, data: { createdAt: at, lastLoginAt: iso(Date.now() - r0.int(0, 6) * DAY - r0.int(0, 20) * 3600_000) } });
  return u;
}
const r0 = rng(Date.now() % 100000);

/* ------------------------------------------------------------------ status, plan */

export async function demoStatus(payload: Payload) {
  const [c] = await rows(
    payload,
    sql`select
      (select count(*) from payload.users where email like ${like} and role = 'tutor') as tutors,
      (select count(*) from payload.users where email like ${like} and role = 'student') as students,
      (select count(*) from payload.bookings b join payload.users u on u.id = b.student_id where u.email like ${like}) as lessons,
      (select count(*) from payload.reviews r join payload.users u on u.id = r.student_id where u.email like ${like}) as reviews,
      (select count(*) from payload.messages m join payload.users u on u.id = m.sender_id where u.email like ${like}) as messages`,
  );
  const n = (k: string) => Number(c?.[k] ?? 0);
  return { loaded: n("tutors") + n("students") > 0, tutors: n("tutors"), students: n("students"), lessons: n("lessons"), reviews: n("reviews"), messages: n("messages") };
}

/** The steps the admin page runs, in order. */
export function demoPlan(): { step: string; label: string }[] {
  const plan = [];
  for (let i = 0; i < DEMO_STUDENTS.length; i += STUDENTS_PER_STEP) plan.push({ step: `students:${i}`, label: "Adding students" });
  for (let i = 0; i < DEMO_TUTORS.length; i += TUTORS_PER_STEP) plan.push({ step: `tutors:${i}`, label: `Adding tutors and their lessons (${Math.min(i + TUTORS_PER_STEP, DEMO_TUTORS.length)} of ${DEMO_TUTORS.length})` });
  plan.push({ step: "applicants", label: "Adding tutor applications" });
  plan.push({ step: "extras", label: "Adding homework, goals and site visits" });
  plan.push({ step: "finish", label: "Working out ratings and badges" });
  return plan;
}

export async function runDemoStep(payload: Payload, admin: User, step: string) {
  const [kind, arg] = step.split(":");
  if (kind === "students") {
    if (+arg === 0 && (await demoStatus(payload)).loaded) throw new Error("Demo data is already loaded. Remove it first to load it again.");
    return addStudents(payload, admin, +arg);
  }
  if (kind === "tutors") return addTutors(payload, admin, +arg);
  if (kind === "applicants") return addApplicants(payload, admin);
  if (kind === "extras") return addExtras(payload);
  if (kind === "finish") return finish(payload);
  throw new Error("Unknown step.");
}

/* ------------------------------------------------------------------ steps */

async function addStudents(payload: Payload, admin: User, from: number) {
  const L = await lookups(payload);
  const r = rng(7 + from);
  const subjectsFor: Record<string, string[]> = {
    exam: ["Mathematics", "KCSE Revision", "Chemistry", "IELTS & TOEFL", "SAT & ACT"],
    school: ["Mathematics", "English", "Biology"],
    career: ["Business English", "Python & Data Science", "Web Development", "Accounting"],
    conversation: ["English Conversation", "French", "Kiswahili", "Spanish"],
    hobby: ["Music", "Spanish", "German"],
    child: ["Mathematics", "English", "Kiswahili"],
  };
  for (const s of DEMO_STUDENTS.slice(from, from + STUDENTS_PER_STEP)) {
    const u = await createUser(payload, admin, { first: s.first, last: s.last, role: "student", country: s.country, tz: s.tz, tag: "s", joinedDaysAgo: r.int(20, 220) });
    await payload.create({
      collection: "student-profiles",
      data: {
        user: u.id,
        goal: s.goal,
        level: s.level,
        pace: r.pick(["1", "2-3", "2-3", "4+"]),
        subjects: r.shuffle(subjectsFor[s.goal]).slice(0, 2).map((n) => L.subject.get(n)).filter(Boolean),
        budgetMin: 10,
        budgetMax: r.pick([25, 30, 40, 50]),
        onboardedAt: iso(Date.now() - r.int(10, 200) * DAY),
      } as never,
      overrideAccess: true,
      user: admin,
    });
  }
  return `Added ${Math.min(STUDENTS_PER_STEP, DEMO_STUDENTS.length - from)} students`;
}

async function demoStudents(payload: Payload) {
  const res = await payload.find({ collection: "users", where: { and: [{ email: { like: `@${DEMO_DOMAIN}` } }, { role: { equals: "student" } }] }, limit: 500, pagination: false, depth: 0, overrideAccess: true, sort: "id" });
  return res.docs;
}

async function addTutors(payload: Payload, admin: User, from: number) {
  const L = await lookups(payload);
  const students = await demoStudents(payload);
  if (!students.length) throw new Error("Add the demo students first.");
  const done: string[] = [];
  for (const [k, t] of DEMO_TUTORS.slice(from, from + TUTORS_PER_STEP).entries()) {
    await addTutor(payload, admin, t, from + k, students, L);
    done.push(`${t.first} ${t.last.charAt(0)}.`);
  }
  return `Added ${done.join(", ")}`;
}

async function tutorProfile(payload: Payload, admin: User, t: Omit<DemoTutor, "load">, L: Awaited<ReturnType<typeof lookups>>, extra: Record<string, unknown>, joinedDaysAgo: number) {
  const user = await createUser(payload, admin, { first: t.first, last: t.last, role: "tutor", country: t.country, tz: t.tz, tag: "t", joinedDaysAgo });
  const subjects = t.subjects.map((n) => L.subject.get(n)).filter((v): v is number => Boolean(v));
  const displayName = `${t.first} ${t.last.charAt(0)}.`;
  const profile = await payload.create({
    collection: "tutor-profiles",
    data: {
      user: user.id,
      displayName,
      slug: `${slugify(displayName)}-${randomBytes(3).toString("hex").slice(0, 5)}`,
      country: t.country,
      timezone: t.tz,
      headline: t.headline.slice(0, 90),
      about: textToLexical(t.about),
      teachingStyle: textToLexical(t.style),
      languages: t.langs.filter(([n]) => L.language.has(n)).map(([n, level]) => ({ language: L.language.get(n), level })),
      primarySubject: subjects[0],
      subjects,
      levelsTaught: t.levels,
      hourlyRate: t.rate,
      offersTrial: true,
      instantBooking: t.instant ?? false,
      noticeHours: 12,
      packages: (t.packages ?? []).map(([lessons, discountPercent]) => ({ lessons: String(lessons), discountPercent })),
      education: t.education.map((e) => ({ degree: e.degree, institution: e.institution, field: e.field, startYear: e.start, endYear: e.end, verified: true })),
      experience: t.experience.map((e) => ({ role: e.role, organization: e.org, startYear: e.start, endYear: e.end ?? null })),
      certifications: (t.certs ?? []).map((c) => ({ title: c.title, issuer: c.issuer, year: c.year, verified: true })),
      identity: { documentType: "national_id", verified: true },
      submittedAt: iso(Date.now() - (joinedDaysAgo - 1) * DAY),
      ...extra,
    } as never,
    overrideAccess: true,
    user: admin,
    context: { skipTutorChecks: true },
  });
  return { user, profile, subjects };
}

async function addTutor(payload: Payload, admin: User, t: DemoTutor, index: number, students: User[], L: Awaited<ReturnType<typeof lookups>>) {
  const r = rng(1000 + index * 97);
  const joined = r.int(150, 330);
  const { user, profile, subjects } = await tutorProfile(
    payload,
    admin,
    t,
    L,
    { status: "approved", approvedAt: iso(Date.now() - (joined - 2) * DAY), isFeatured: Boolean(t.featured), isSuperTutor: Boolean(t.superTutor), reviewHistory: [{ action: "approved", notes: "Documents checked.", at: iso(Date.now() - (joined - 2) * DAY), by: admin.id }] },
    joined,
  );
  const weekly = weeklyHours(r);
  await payload.create({ collection: "schedules", data: { user: user.id, timezone: t.tz, weekly, noticeHours: 12, bufferMinutes: r.pick([0, 0, 10, 15]), instantBooking: t.instant ?? false } as never, overrideAccess: true, user: admin });

  // Students, lessons, reviews, payments and messages.
  const mine = r.shuffle(students).slice(0, Math.max(3, Math.round(t.load * r.int(6, 11))));
  const lessonsTotal = Math.round(t.load * r.int(22, 40));
  const taken = new Set<string>();
  const firstName = t.first;
  const subjectName = (id: number | undefined) => [...L.subject.entries()].find(([, v]) => v === id)?.[0] ?? t.subjects[0];
  const now = Date.now();
  const seen = new Set<number>();
  const reviewedBy = new Map<number, number>();
  const completed: { student: User; at: Date }[] = [];

  const book = async (student: User, startsAt: Date, kind: "trial" | "regular", status: "completed" | "confirmed" | "cancelled") => {
    const minutes = kind === "trial" ? L.trialMinutes : r.pick([60, 60, 60, 45, 90]);
    const full = Math.round(((t.rate * minutes) / 60) * 100) / 100;
    const price = kind === "trial" ? Math.round(full * (100 - L.trialDiscount)) / 100 : full;
    const subject = r.pick(subjects);
    const endsAt = new Date(startsAt.getTime() + minutes * 60000);
    const createdAt = new Date(startsAt.getTime() - r.int(1, 9) * DAY - r.int(0, 20) * 3600_000);
    const past = status !== "confirmed";
    const b = await payload.db.create({
      collection: "bookings",
      data: {
        reference: ref("SB"),
        status,
        paymentStatus: status === "cancelled" ? "refunded" : "paid",
        startsAt: iso(startsAt),
        endsAt: iso(endsAt),
        student: student.id,
        tutor: profile.id,
        tutorUser: user.id,
        subject,
        kind,
        minutes,
        price,
        currency: L.currency,
        platformFeePercent: L.fee,
        studentTimezone: student.timezone ?? "UTC",
        autoConfirm: Boolean(t.instant),
        respondedAt: iso(createdAt.getTime() + r.int(5, 120) * 60000),
        refundedAmount: status === "cancelled" ? price : 0,
        ...(status === "completed"
          ? {
              studentJoinedAt: iso(startsAt.getTime() - r.int(0, 3) * 60000),
              tutorJoinedAt: iso(startsAt.getTime() - r.int(1, 6) * 60000),
              completedAt: iso(endsAt),
              remindedDayAt: iso(startsAt.getTime() - DAY),
              remindedHourAt: iso(startsAt.getTime() - 3600_000),
              reviewPromptedAt: iso(endsAt.getTime() + 600_000),
              tutorNotes: r.chance(0.45) ? textToLexical(r.pick(LESSON_NOTES)) : null,
            }
          : {}),
        ...(status === "cancelled" ? { cancelledBy: "student", cancelReason: r.pick(["Something came up at school.", "I'm travelling that week.", "Feeling unwell, sorry!"]), cancelledAt: iso(startsAt.getTime() - r.int(1, 3) * DAY) } : {}),
        history: [
          { id: rid(), action: "paid", by: student.id, at: iso(createdAt.getTime() + 120_000) },
          ...(status === "completed" ? [{ id: rid(), action: "completed", at: iso(endsAt) }] : status === "cancelled" ? [{ id: rid(), action: "cancelled by student", by: student.id, at: iso(startsAt.getTime() - DAY) }] : []),
        ],
        createdAt: iso(createdAt),
        updatedAt: iso(past ? Math.min(now, endsAt.getTime()) : createdAt.getTime()),
      },
    });
    await payload.db.create({
      collection: "payments",
      data: {
        reference: ref("PAY"),
        status: status === "cancelled" ? "refunded" : "succeeded",
        provider: student.country === "Kenya" || student.country === "Uganda" || student.country === "Tanzania" ? "paystack" : "stripe",
        method: student.country === "Kenya" ? r.pick(["mobile_money", "mobile_money", "card"]) : "card",
        amount: price,
        currency: L.currency,
        refundedAmount: status === "cancelled" ? price : 0,
        booking: b.id,
        student: student.id,
        tutor: profile.id,
        paidAt: iso(createdAt.getTime() + 120_000),
        ...(status === "cancelled" ? { refunds: [{ id: rid(), amount: price, reason: "Cancelled in time", at: iso(startsAt.getTime() - DAY) }] } : {}),
        createdAt: iso(createdAt),
        updatedAt: iso(createdAt),
      },
    });
    if (status === "completed") completed.push({ student, at: endsAt });

    // Reviews: most students rate most lessons; at most three reviews per student.
    const count = reviewedBy.get(student.id) ?? 0;
    if (status === "completed" && count < 3 && r.chance(count ? 0.45 : 0.8)) {
      reviewedBy.set(student.id, count + 1);
      const roll = r.next();
      const rating = (roll < 0.82 ? 5 : roll < 0.97 ? 4 : 3) as 5 | 4 | 3;
      const at = endsAt.getTime() + r.int(10, 600) * 60000;
      await payload.db.create({
        collection: "reviews",
        data: {
          title: `${rating}★`,
          rating,
          status: "published",
          comment: fill(r.pick(REVIEWS[rating]), { t: firstName, s: subjectName(subject) }),
          highlights: rating >= 4 ? r.shuffle(HIGHLIGHTS.map((h) => h.value)).slice(0, r.int(1, 3)) : [],
          tutorReply: rating < 5 || r.chance(0.35) ? r.pick(REPLIES) : null,
          booking: b.id,
          tutor: profile.id,
          student: student.id,
          studentName: `${student.firstName} ${String(student.lastName).charAt(0)}.`,
          subject: subjectName(subject),
          createdAt: iso(Math.min(at, now)),
          updatedAt: iso(Math.min(at, now)),
        },
      });
    }
    return b;
  };

  // Past lessons, oldest first, spread over each student's time with the tutor.
  let made = 0;
  for (let attempt = 0; made < lessonsTotal && attempt < lessonsTotal * 6; attempt++) {
    const student = mine[made % mine.length];
    const days = -r.int(1, Math.min(joined - 5, 170));
    const at = slotOn(t.tz, weekly, days, taken, r);
    if (!at || at.getTime() > now - 2 * 3600_000) continue;
    const first = !seen.has(student.id);
    seen.add(student.id);
    await book(student, at, first ? "trial" : "regular", r.chance(0.06) ? "cancelled" : "completed");
    made++;
  }
  // Upcoming lessons over the next two weeks.
  const upcoming = Math.max(1, Math.round(t.load * r.int(3, 6)));
  for (let i = 0, attempt = 0; i < upcoming && attempt < 60; attempt++) {
    const at = slotOn(t.tz, weekly, r.int(1, 14), taken, r);
    if (!at) continue;
    await book(r.pick(mine), at, "regular", "confirmed");
    i++;
  }

  // Message threads with about half the students.
  for (const student of mine.filter(() => r.chance(0.55))) {
    const thread = r.pick(THREADS);
    let at = now - r.int(1, 40) * DAY - r.int(0, 600) * 60000;
    const conv = await payload.db.create({
      collection: "conversations",
      data: { title: `${student.firstName} ${String(student.lastName).charAt(0)}. ↔ ${profile.displayName}`, student: student.id, tutorUser: user.id, tutor: profile.id, messageCount: 0, createdAt: iso(at), updatedAt: iso(at) },
    });
    let last = "";
    let lastSender = student.id;
    for (const [who, text] of thread) {
      at += who === "t" ? r.int(6, 75) * 60000 : r.int(10, 300) * 60000;
      last = fill(text, { t: firstName, n: student.firstName ?? "", s: subjectName(r.pick(subjects)) });
      lastSender = who === "t" ? user.id : student.id;
      await payload.db.create({ collection: "messages", data: { conversation: conv.id, sender: lastSender, body: last, hidden: false, createdAt: iso(Math.min(at, now)), updatedAt: iso(Math.min(at, now)) } });
    }
    const end = iso(Math.min(at, now));
    await payload.db.updateOne({ collection: "conversations", id: conv.id, data: { lastMessageAt: end, lastPreview: last.slice(0, 140), lastSender, messageCount: thread.length, studentReadAt: end, tutorReadAt: end } });
  }

  // Saved tutors: some of the tutor's students keep them in their list.
  for (const s of mine.filter(() => r.chance(0.4))) {
    const sp = await payload.find({ collection: "student-profiles", where: { user: { equals: s.id } }, limit: 1, depth: 0, overrideAccess: true });
    const p = sp.docs[0];
    if (p) {
      const saved = ((p.savedTutors ?? []) as (number | { id: number })[]).map((x) => (typeof x === "object" ? x.id : x));
      await payload.update({ collection: "student-profiles", id: p.id, data: { savedTutors: [...new Set([...saved, profile.id])] } as never, overrideAccess: true, user: admin });
    }
  }
  await refreshStats(payload, profile.id);
}

async function refreshStats(payload: Payload, tutorId: number) {
  const [s] = await rows(
    payload,
    sql`select
      (select coalesce(round(avg(rating)::numeric, 1), 0) from payload.reviews where tutor_id = ${tutorId} and status = 'published') as rating,
      (select count(*) from payload.reviews where tutor_id = ${tutorId} and status = 'published') as reviews,
      (select count(*) from payload.bookings where tutor_id = ${tutorId} and status = 'completed') as lessons,
      (select count(distinct student_id) from payload.bookings where tutor_id = ${tutorId} and status = 'completed') as students`,
  );
  await payload.db.drizzle.execute(
    sql`update payload.tutor_profiles set stats_rating = ${Number(s.rating)}, stats_review_count = ${Number(s.reviews)}, stats_lessons_taught = ${Number(s.lessons)}, stats_students_taught = ${Number(s.students)} where id = ${tutorId}`,
  );
}

async function addApplicants(payload: Payload, admin: User) {
  const L = await lookups(payload);
  for (const [i, a] of DEMO_APPLICANTS.entries()) {
    await tutorProfile(payload, admin, a, L, { status: "submitted", submittedAt: iso(Date.now() - (i + 1) * 0.6 * DAY) }, i + 2);
  }
  return `Added ${DEMO_APPLICANTS.length} tutor applications waiting for review`;
}

async function addExtras(payload: Payload) {
  const r = rng(4242);
  const now = Date.now();
  // Homework and goals for the students with the most lessons.
  const pairs = await rows(
    payload,
    sql`select b.student_id, b.tutor_user_id, max(b.subject_id) as subject_id, max(b.id) as booking_id, count(*) as n
        from payload.bookings b join payload.users u on u.id = b.student_id
        where u.email like ${like} and b.status = 'completed'
        group by b.student_id, b.tutor_user_id order by n desc limit 14`,
  );
  for (const [i, p] of pairs.entries()) {
    const base = { student: Number(p.student_id), tutorUser: Number(p.tutor_user_id), subject: Number(p.subject_id) || null, lesson: Number(p.booking_id) };
    const set = now - r.int(5, 12) * DAY;
    await payload.db.create({
      collection: "assignments",
      data: { ...base, title: r.pick(HOMEWORK), kind: "homework", status: "reviewed", dueAt: iso(set + 4 * DAY), instructions: textToLexical("Work through the questions on your own first, then check your notes from our lesson."), answer: textToLexical("Done! I found the last two hard but I think I got them."), submittedAt: iso(set + 3 * DAY), score: r.int(6, 10), outOf: 10, feedback: textToLexical(r.pick(["Good work. Watch your units in question 4.", "Much better than last week. Well done!", "Nice effort. Let's go over question 7 together next lesson."])), reviewedAt: iso(set + 3.5 * DAY), createdAt: iso(set), updatedAt: iso(set + 3.5 * DAY) },
    });
    await payload.db.create({ collection: "assignments", data: { ...base, title: r.pick(HOMEWORK), kind: "homework", status: i % 3 === 0 ? "submitted" : "assigned", dueAt: iso(now + r.int(1, 6) * DAY), instructions: textToLexical("Have this ready before our next lesson."), ...(i % 3 === 0 ? { submittedAt: iso(now - 3600_000), answer: textToLexical("Here is my work for this week.") } : {}), createdAt: iso(now - r.int(1, 3) * DAY), updatedAt: iso(now - 3600_000) } });
    if (i < 10) {
      const [title, steps] = GOALS[i % GOALS.length];
      const doneCount = r.int(1, steps.length - 1);
      await payload.db.create({
        collection: "goals",
        data: { student: base.student, createdBy: base.tutorUser, subject: base.subject, title, status: "active", targetDate: iso(now + r.int(30, 150) * DAY), milestones: steps.map((text, k) => ({ id: rid(), text, done: k < doneCount, doneAt: k < doneCount ? iso(now - (doneCount - k) * 9 * DAY) : null })), createdAt: iso(now - 60 * DAY), updatedAt: iso(now - 2 * DAY) },
      });
    }
  }

  // Site visits for the last 60 days, so analytics and the funnel have something to show.
  const ids = (await rows(payload, sql`select id from payload.users where email like ${like} and role = 'student'`)).map((x) => Number(x.id));
  await payload.db.drizzle.execute(sql`
    insert into analytics.events (at, type, path, visitor, session, source, channel, country, device, browser, os, meta)
    select
      now() - (random() * interval '60 days'),
      'pageview',
      (array['/', '/', '/', '/tutors', '/tutors', '/tutors', '/subjects', '/match', '/how-it-works', '/pricing', '/become-a-tutor', '/blog', '/subjects/mathematics', '/subjects/english', '/subjects/kcse-revision'])[1 + floor(random() * 15)::int],
      'dv' || (floor(random() * 2600))::int,
      'ds' || g,
      (array[null, null, 'google.com', 'google.com', 'instagram.com', 'facebook.com', 'tiktok.com', 'chatgpt.com', null])[1 + floor(random() * 9)::int],
      (array['direct', 'direct', 'search', 'search', 'search', 'social', 'social', 'referral', 'email'])[1 + floor(random() * 9)::int],
      (array['KE', 'KE', 'KE', 'KE', 'KE', 'UG', 'TZ', 'NG', 'GB', 'US', 'RW', 'GH'])[1 + floor(random() * 12)::int],
      (array['mobile', 'mobile', 'mobile', 'desktop', 'desktop', 'tablet'])[1 + floor(random() * 6)::int],
      (array['Chrome', 'Chrome', 'Chrome', 'Safari', 'Safari', 'Edge', 'Firefox', 'Samsung'])[1 + floor(random() * 8)::int],
      (array['Android', 'Android', 'Android', 'iOS', 'iOS', 'Windows', 'Windows', 'macOS'])[1 + floor(random() * 8)::int],
      '{"demo": true}'::jsonb
    from generate_series(1, 9000) g
  `);
  // Sign-ups and lessons in the funnel.
  await payload.db.drizzle.execute(sql`
    insert into analytics.events (at, type, user_id, meta)
    select u.created_at, 'signup', u.id, '{"demo": true}'::jsonb from payload.users u where u.email like ${like}
    union all
    select b.created_at, 'booking_created', b.student_id, '{"demo": true}'::jsonb from payload.bookings b join payload.users u on u.id = b.student_id where u.email like ${like}
    union all
    select b.created_at + interval '2 minutes', 'payment_succeeded', b.student_id, '{"demo": true}'::jsonb from payload.bookings b join payload.users u on u.id = b.student_id where u.email like ${like} and b.payment_status in ('paid', 'refunded')
    union all
    select b.completed_at, 'lesson_completed', b.student_id, '{"demo": true}'::jsonb from payload.bookings b join payload.users u on u.id = b.student_id where u.email like ${like} and b.status = 'completed'
    union all
    select r.created_at, 'review_submitted', r.student_id, '{"demo": true}'::jsonb from payload.reviews r join payload.users u on u.id = r.student_id where u.email like ${like}
  `);
  return `Added homework, goals and site visits for ${ids.length} students`;
}

async function finish(payload: Payload) {
  await (await import("../tutors/badges-server")).refreshBadges(payload, true);
  const s = await demoStatus(payload);
  return `Done: ${s.tutors} tutors, ${s.students} students, ${s.lessons} lessons, ${s.reviews} reviews`;
}

/* ------------------------------------------------------------------ remove, guards */

/** Delete every demo account and everything attached to it, in one transaction. */
export async function removeDemo(payload: Payload) {
  const before = await demoStatus(payload);
  const users = sql`(select id from payload.users where email like ${like})`;
  const tutors = sql`(select id from payload.tutor_profiles where user_id in ${users})`;
  const bookings = sql`(select id from payload.bookings where student_id in ${users} or tutor_user_id in ${users} or tutor_id in ${tutors})`;
  const convs = sql`(select id from payload.conversations where student_id in ${users} or tutor_user_id in ${users})`;
  await payload.db.drizzle.transaction(async (tx) => {
    const run = (q: ReturnType<typeof sql>) => tx.execute(q);
    await run(sql`delete from payload.reviews where booking_id in ${bookings} or student_id in ${users} or tutor_id in ${tutors}`);
    await run(sql`delete from payload.payments where booking_id in ${bookings} or student_id in ${users} or tutor_id in ${tutors}`);
    await run(sql`delete from payload.assignments where student_id in ${users} or tutor_user_id in ${users}`);
    await run(sql`delete from payload.goals where student_id in ${users}`);
    await run(sql`delete from payload.messages where conversation_id in ${convs} or sender_id in ${users}`);
    await run(sql`delete from payload.conversations where id in ${convs}`);
    await run(sql`delete from payload.bookings where id in ${bookings}`);
    await run(sql`delete from payload.lesson_packages where student_id in ${users} or tutor_id in ${tutors}`);
    await run(sql`delete from payload.credits where user_id in ${users}`);
    await run(sql`delete from payload.notifications where user_id in ${users}`);
    await run(sql`delete from payload.schedules where user_id in ${users}`);
    await run(sql`delete from payload.student_profiles where user_id in ${users}`);
    await run(sql`delete from payload.tutor_profiles where user_id in ${users}`);
    await run(sql`delete from payload.email_log where "to" like ${like}`);
    await run(sql`delete from analytics.events where meta->>'demo' = 'true' or user_id in ${users}`);
    await run(sql`delete from payload.users where email like ${like}`);
  });
  return before;
}

/** True when the tutor profile belongs to a demo account. */
export async function isDemoTutor(payload: Payload, tutorId: number) {
  const [r] = await rows(payload, sql`select 1 as x from payload.tutor_profiles t join payload.users u on u.id = t.user_id where t.id = ${tutorId} and u.email like ${like} limit 1`).catch(() => []);
  return Boolean(r);
}

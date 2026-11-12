import "server-only";
import { randomBytes } from "node:crypto";
import type { Payload } from "payload";
import type { TrainingCourse, TrainingProgress, User } from "@/payload-types";
import { contentRules, fill, mediaUrl } from "../content/server";
import { getPolicies } from "../tutors/server";
import { BookingError } from "../scheduling/server";
import { starterCourse } from "./seed";

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === "object" ? ((v as { id: number }).id ?? null) : Number(v));

/** Create the starter course the first time the academy is opened. */
async function ensureAcademy(payload: Payload) {
  const n = await payload.count({ collection: "training-courses", overrideAccess: true });
  if (n.totalDocs) return;
  const p = await getPolicies(payload);
  const course = starterCourse({ ...(await contentRules(payload)), holdDays: Number(p.earningsHoldDays), minPayout: Number(p.minimumPayout), currency: String(p.currency) });
  await payload.create({ collection: "training-courses", data: course as never, overrideAccess: true }).catch(() => undefined);
}

async function published(payload: Payload) {
  await ensureAcademy(payload);
  return (await payload.find({ collection: "training-courses", where: { status: { equals: "published" } }, sort: "order", limit: 100, depth: 1, overrideAccess: true })).docs;
}

async function progressFor(payload: Payload, user: User, courseId?: number) {
  const r = await payload.find({ collection: "training-progress", where: { and: [{ tutorUser: { equals: user.id } }, ...(courseId ? [{ course: { equals: courseId } }] : [])] }, limit: 200, depth: 0, overrideAccess: true });
  return r.docs;
}

const done = (p: TrainingProgress | undefined) => new Set(((p?.completedLessons as string[] | null) ?? []).map(String));
const minutesOf = (c: TrainingCourse) => (c.lessons ?? []).reduce((s, l) => s + (l.minutes ?? 0), 0);

export type CourseCard = { slug: string; title: string; summary: string; cover: string | null; lessons: number; minutes: number; percent: number; passed: boolean; certificate: string | null; recommended: boolean };

export async function listCourses(payload: Payload, user: User): Promise<CourseCard[]> {
  const [courses, progress] = await Promise.all([published(payload), progressFor(payload, user)]);
  const rules = await contentRules(payload);
  return courses.map((c) => {
    const p = progress.find((x) => idOf(x.course) === c.id);
    return fill(
      { slug: c.slug, title: c.title, summary: c.summary, cover: mediaUrl(c.cover, "card"), lessons: c.lessons?.length ?? 0, minutes: minutesOf(c), percent: p?.percent ?? 0, passed: Boolean(p?.passedAt), certificate: p?.certificate ?? null, recommended: Boolean(c.required) },
      rules,
    );
  });
}

async function courseBySlug(payload: Payload, slug: string) {
  await ensureAcademy(payload);
  const c = (await payload.find({ collection: "training-courses", where: { and: [{ slug: { equals: slug } }, { status: { equals: "published" } }] }, limit: 1, depth: 1, overrideAccess: true })).docs[0];
  if (!c) throw new BookingError("Course not found.", 404);
  return c;
}

/** The course for a tutor: lessons with their content, the quiz without answers, and progress. */
export async function courseView(payload: Payload, user: User, slug: string) {
  const c = await courseBySlug(payload, slug);
  const p = (await progressFor(payload, user, c.id))[0];
  const completed = done(p);
  const rules = await contentRules(payload);
  return fill(
    {
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      minutes: minutesOf(c),
      lessons: (c.lessons ?? []).map((l) => ({ id: String(l.id), title: l.title, minutes: l.minutes ?? 0, video: l.video ?? null, body: l.body, done: completed.has(String(l.id)) })),
      quiz: { passMark: c.quiz?.passMark ?? 80, questions: (c.quiz?.questions ?? []).map((q) => ({ question: q.question, options: (q.options ?? []).map((o) => o.text) })) },
      best: p?.quizBest ?? null,
      attempts: p?.attempts ?? 0,
      passed: Boolean(p?.passedAt),
      certificate: p?.certificate ?? null,
    },
    rules,
  );
}
export type CourseView = Awaited<ReturnType<typeof courseView>>;

async function saveProgress(payload: Payload, user: User, c: TrainingCourse, patch: Partial<TrainingProgress>) {
  const existing = (await progressFor(payload, user, c.id))[0];
  if (existing) return payload.update({ collection: "training-progress", id: existing.id, data: patch, overrideAccess: true, depth: 0 });
  return payload.create({ collection: "training-progress", data: { title: `${user.firstName ?? user.email} · ${c.title}`, tutorUser: user.id, course: c.id, completedLessons: [], ...patch } as never, overrideAccess: true, depth: 0 });
}

export async function completeLesson(payload: Payload, user: User, slug: string, lessonId: string) {
  const c = await courseBySlug(payload, slug);
  const ids = (c.lessons ?? []).map((l) => String(l.id));
  if (!ids.includes(lessonId)) throw new BookingError("Lesson not found.", 404);
  const p = (await progressFor(payload, user, c.id))[0];
  const set = done(p);
  set.add(lessonId);
  const list = ids.filter((i) => set.has(i));
  const hasQuiz = (c.quiz?.questions?.length ?? 0) > 0;
  const percent = Math.round(((list.length + (p?.passedAt ? 1 : 0)) / (ids.length + (hasQuiz ? 1 : 0))) * 100);
  await saveProgress(payload, user, c, { completedLessons: list, percent: !hasQuiz && list.length === ids.length ? 100 : percent, ...(!hasQuiz && list.length === ids.length && !p?.passedAt ? { passedAt: new Date().toISOString(), certificate: certNo() } : {}) });
  return { completed: list.length, total: ids.length };
}

const certNo = () => `SAB-${randomBytes(3).toString("hex").toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;

export async function submitQuiz(payload: Payload, user: User, slug: string, answers: number[]) {
  const c = await courseBySlug(payload, slug);
  const p = (await progressFor(payload, user, c.id))[0];
  const ids = (c.lessons ?? []).map((l) => String(l.id));
  if (ids.some((i) => !done(p).has(i))) throw new BookingError("Finish all the lessons first, then take the quiz.", 409);
  const qs = c.quiz?.questions ?? [];
  if (!qs.length) throw new BookingError("This course has no quiz.", 409);
  if (answers.length !== qs.length || answers.some((a) => !Number.isInteger(a))) throw new BookingError("Answer every question.");
  const rules = await contentRules(payload);
  const results = qs.map((q, i) => ({ correct: answers[i] === q.answer, answer: q.answer, explain: fill(q.explain ?? "", rules) }));
  const score = Math.round((results.filter((r) => r.correct).length / qs.length) * 100);
  const passMark = c.quiz?.passMark ?? 80;
  const passed = score >= passMark;
  const already = Boolean(p?.passedAt);
  const saved = await saveProgress(payload, user, c, {
    attempts: (p?.attempts ?? 0) + 1,
    quizBest: Math.max(score, p?.quizBest ?? 0),
    ...(passed && !already ? { passedAt: new Date().toISOString(), certificate: certNo(), percent: 100 } : {}),
  });
  return { score, passMark, passed: passed || already, results, certificate: saved.certificate ?? null };
}

/** Certificate details for the tutor who earned it. */
export async function certificate(payload: Payload, user: User, slug: string) {
  const c = await courseBySlug(payload, slug);
  const p = (await progressFor(payload, user, c.id))[0];
  if (!p?.passedAt || !p.certificate) return null;
  return { course: c.title, name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email, number: p.certificate, date: p.passedAt, score: p.quizBest ?? null };
}

import "server-only";
import crypto from "node:crypto";
import type { Payload, Where } from "payload";
import type { Assignment, Goal, Subject, TutorProfile, User } from "@/payload-types";
import { BookingError, personOf, send, shortName } from "../scheduling/server";
import { lexicalToText, toSafeLexical, type Lexical } from "../content/rich";
import { homeworkReviewed, homeworkSet, homeworkSubmitted } from "../email/progress";

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === "object" ? ((v as { id: number }).id ?? null) : Number(v));
const TEACHING = ["requested", "confirmed", "completed", "no_show"];

/** True when the tutor has (or had) a lesson with the student. */
export async function teaches(payload: Payload, tutorUserId: number, studentId: number) {
  const r = await payload.count({ collection: "bookings", where: { and: [{ tutorUser: { equals: tutorUserId } }, { student: { equals: studentId } }, { status: { in: TEACHING } }] }, overrideAccess: true });
  return r.totalDocs > 0;
}

/* ------------------------------------------------------------------ homework & quizzes */

export type QuestionInput = { prompt: string; type: "choice" | "short"; options?: string[]; correct?: number; accepted?: string; explanation?: string };
export type AssignmentInput = { studentId: number; kind: "homework" | "quiz"; title: string; instructions?: unknown; dueAt?: string | null; lessonId?: number | null; questions?: QuestionInput[] };

const norm = (s: unknown) => String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[.!?]+$/, "");

function cleanQuestions(qs: QuestionInput[] | undefined) {
  const list = (qs ?? []).slice(0, 30).map((q, i) => {
    const prompt = String(q?.prompt ?? "").trim().slice(0, 600);
    if (!prompt) throw new BookingError(`Question ${i + 1} needs a question.`);
    const explanation = String(q.explanation ?? "").trim().slice(0, 600) || null;
    if (q.type === "short") {
      const accepted = String(q.accepted ?? "").split("|").map((x) => x.trim()).filter(Boolean).slice(0, 10);
      if (!accepted.length) throw new BookingError(`Question ${i + 1}: add at least one accepted answer.`);
      return { prompt, type: "short" as const, accepted: accepted.join(" | ").slice(0, 300), explanation, options: [], correct: null };
    }
    const options = (q.options ?? []).map((o) => String(o ?? "").trim().slice(0, 200)).filter(Boolean).slice(0, 6);
    if (options.length < 2) throw new BookingError(`Question ${i + 1}: add at least two choices.`);
    const correct = Number(q.correct);
    if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) throw new BookingError(`Question ${i + 1}: choose the right answer.`);
    return { prompt, type: "choice" as const, options: options.map((text) => ({ text })), correct, explanation, accepted: null };
  });
  if (!list.length) throw new BookingError("Add at least one question.");
  return list;
}

export async function createAssignment(payload: Payload, tutor: User, input: AssignmentInput) {
  if (tutor.role !== "tutor") throw new BookingError("Only tutors can set homework.", 403);
  const studentId = Number(input.studentId);
  if (!studentId || !(await teaches(payload, tutor.id, studentId))) throw new BookingError("You can set homework for your own students only.", 403);
  const title = String(input.title ?? "").trim().slice(0, 140);
  if (!title) throw new BookingError("Give it a title.");
  const kind = input.kind === "quiz" ? "quiz" : "homework";
  let instructions: Lexical | null = null;
  try {
    instructions = toSafeLexical(input.instructions, 4000, "The instructions");
  } catch (e) {
    if (e instanceof RangeError) throw new BookingError(e.message);
    throw e;
  }
  if (kind === "homework" && !instructions) throw new BookingError("Add some instructions.");
  const dueAt = input.dueAt && Number.isFinite(Date.parse(input.dueAt)) ? new Date(input.dueAt).toISOString() : null;
  if (dueAt && Date.parse(dueAt) < Date.now() - 60_000) throw new BookingError("Pick a due date in the future.");
  const questions = kind === "quiz" ? cleanQuestions(input.questions) : [];

  // Link to a lesson (and its subject) when given; otherwise the latest lesson's subject.
  const lessons = await payload.find({ collection: "bookings", where: { and: [{ tutorUser: { equals: tutor.id } }, { student: { equals: studentId } }, ...(input.lessonId ? [{ id: { equals: Number(input.lessonId) } }] : [])] }, sort: "-startsAt", limit: 1, depth: 0, overrideAccess: true });
  const lesson = lessons.docs[0];

  const a = await payload.create({
    collection: "assignments",
    data: { title, kind, status: "assigned", dueAt, student: studentId, tutorUser: tutor.id, subject: idOf(lesson?.subject), lesson: input.lessonId && lesson ? lesson.id : null, instructions, questions, outOf: kind === "quiz" ? questions.length : null } as never,
    overrideAccess: true,
  });
  const student = await payload.findByID({ collection: "users", id: studentId, depth: 0, overrideAccess: true });
  void send(payload, student, homeworkSet(personOf(student), { id: a.id, kind, title, tutorName: shortName(tutor), dueAt }));
  return a;
}

/** What one side may see. Students don't see quiz answers until they've finished. */
export function assignmentView(a: Assignment, viewer: "student" | "tutor") {
  const finished = a.status !== "assigned";
  const responses = (Array.isArray(a.responses) ? a.responses : []) as (string | number | null)[];
  const subject = a.subject && typeof a.subject === "object" ? (a.subject as Subject).name : null;
  return {
    id: a.id,
    title: a.title,
    kind: a.kind,
    status: a.status,
    dueAt: a.dueAt ?? null,
    subject,
    createdAt: a.createdAt,
    submittedAt: a.submittedAt ?? null,
    reviewedAt: a.reviewedAt ?? null,
    instructions: (a.instructions as Lexical | null) ?? null,
    answer: (a.answer as Lexical | null) ?? null,
    feedback: (a.feedback as Lexical | null) ?? null,
    score: a.score ?? null,
    outOf: a.outOf ?? null,
    files: (a.files ?? []).filter((f) => f && typeof f === "object").map((f) => ({ id: (f as { id: number }).id, name: String((f as { filename?: string }).filename ?? "file").replace(/^homework-\d+-\d+-/, ""), url: (f as { url?: string }).url ?? null })),
    student: a.student && typeof a.student === "object" ? { id: (a.student as User).id, name: shortName(a.student as User) } : { id: idOf(a.student)!, name: "Student" },
    tutor: a.tutorUser && typeof a.tutorUser === "object" ? { id: (a.tutorUser as User).id, name: shortName(a.tutorUser as User) } : { id: idOf(a.tutorUser)!, name: "Tutor" },
    questions: (a.questions ?? []).map((q, i) => ({
      prompt: q.prompt,
      type: q.type,
      options: (q.options ?? []).map((o) => o.text),
      response: responses[i] ?? null,
      // Answers only after finishing (or always for the tutor who wrote them).
      ...(finished || viewer === "tutor"
        ? { correct: q.type === "choice" ? (q.correct ?? null) : null, accepted: q.type === "short" ? String(q.accepted ?? "").split("|").map((x) => x.trim()).filter(Boolean) : [], explanation: q.explanation ?? null, right: finished ? isRight(q, responses[i]) : null }
        : { correct: null, accepted: [], explanation: null, right: null }),
    })),
  };
}
export type AssignmentView = ReturnType<typeof assignmentView>;

function isRight(q: NonNullable<Assignment["questions"]>[number], r: unknown) {
  if (r == null || r === "") return false;
  if (q.type === "choice") return Number(r) === q.correct;
  return String(q.accepted ?? "").split("|").map(norm).filter(Boolean).includes(norm(r));
}

async function load(payload: Payload, id: number) {
  return payload.findByID({ collection: "assignments", id, depth: 1, overrideAccess: true }).catch(() => null);
}

export async function getAssignment(payload: Payload, user: User, id: number) {
  const a = await load(payload, id);
  if (!a) return null;
  if (idOf(a.student) === user.id) return assignmentView(a, "student");
  if (idOf(a.tutorUser) === user.id) return assignmentView(a, "tutor");
  return null;
}

export async function listAssignments(payload: Payload, user: User, opts: { studentId?: number } = {}) {
  const where: Where = user.role === "tutor" ? { and: [{ tutorUser: { equals: user.id } }, ...(opts.studentId ? [{ student: { equals: opts.studentId } }] : [])] as Where[] } : { student: { equals: user.id } };
  const r = await payload.find({ collection: "assignments", where, sort: "-createdAt", limit: 200, depth: 1, overrideAccess: true });
  return r.docs.map((a) => assignmentView(a, user.role === "tutor" ? "tutor" : "student"));
}

/** Student hands in homework (text + files) or finishes a quiz (marked straight away). */
export async function submitAssignment(payload: Payload, student: User, id: number, input: { answer?: unknown; files?: unknown[]; responses?: unknown[] }) {
  const a = await load(payload, id);
  if (!a || idOf(a.student) !== student.id) throw new BookingError("Not found.", 404);
  if (a.status !== "assigned") throw new BookingError(a.kind === "quiz" ? "You've already finished this quiz." : "You've already handed this in.", 409);
  const now = new Date().toISOString();
  let patch: Record<string, unknown>;
  if (a.kind === "quiz") {
    const qs = a.questions ?? [];
    const responses = qs.map((q, i) => {
      const r = (input.responses ?? [])[i];
      if (q.type === "choice") return Number.isInteger(Number(r)) && r !== null && r !== "" ? Number(r) : null;
      return String(r ?? "").trim().slice(0, 300) || null;
    });
    if (responses.every((r) => r == null)) throw new BookingError("Answer at least one question.");
    const score = qs.reduce((n, q, i) => n + (isRight(q, responses[i]) ? 1 : 0), 0);
    patch = { responses, score, outOf: qs.length, status: "reviewed", submittedAt: now, reviewedAt: now };
  } else {
    let answer: Lexical | null;
    try {
      answer = toSafeLexical(input.answer, 8000, "Your answer");
    } catch (e) {
      if (e instanceof RangeError) throw new BookingError(e.message);
      throw e;
    }
    const wanted = (input.files ?? []).map(Number).filter(Boolean).slice(0, 5);
    const owned = wanted.length ? (await payload.find({ collection: "private-files", where: { and: [{ id: { in: wanted } }, { owner: { equals: student.id } }, { kind: { equals: "homework" } }] }, limit: 5, depth: 0, overrideAccess: true })).docs.map((f) => f.id) : [];
    if (!answer && !owned.length) throw new BookingError("Write an answer or add a file.");
    patch = { answer, files: owned, status: "submitted", submittedAt: now };
  }
  const updated = await payload.update({ collection: "assignments", id: a.id, data: patch as never, overrideAccess: true, depth: 1 });
  const tutor = await payload.findByID({ collection: "users", id: idOf(a.tutorUser)!, depth: 0, overrideAccess: true });
  void send(payload, tutor, homeworkSubmitted(personOf(tutor), { id: a.id, kind: a.kind, title: a.title, studentName: shortName(student), score: updated.score, outOf: updated.outOf, studentId: student.id }));
  return assignmentView(updated, "student");
}

/** Tutor leaves feedback (homework or quiz). */
export async function reviewAssignment(payload: Payload, tutor: User, id: number, input: { feedback?: unknown }) {
  const a = await load(payload, id);
  if (!a || idOf(a.tutorUser) !== tutor.id) throw new BookingError("Not found.", 404);
  if (a.status === "assigned") throw new BookingError("The student hasn't handed this in yet.", 409);
  let feedback: Lexical | null;
  try {
    feedback = toSafeLexical(input.feedback, 4000, "Your feedback");
  } catch (e) {
    if (e instanceof RangeError) throw new BookingError(e.message);
    throw e;
  }
  if (!feedback) throw new BookingError("Write some feedback.");
  const first = !a.feedback;
  const updated = await payload.update({ collection: "assignments", id: a.id, data: { feedback, status: "reviewed", reviewedAt: new Date().toISOString() } as never, overrideAccess: true, depth: 1 });
  if (first) {
    const student = await payload.findByID({ collection: "users", id: idOf(a.student)!, depth: 0, overrideAccess: true });
    void send(payload, student, homeworkReviewed(personOf(student), { id: a.id, title: a.title, tutorName: shortName(tutor) }));
  }
  return assignmentView(updated, "tutor");
}

export async function deleteAssignment(payload: Payload, tutor: User, id: number) {
  const a = await load(payload, id);
  if (!a || idOf(a.tutorUser) !== tutor.id) throw new BookingError("Not found.", 404);
  if (a.status !== "assigned") throw new BookingError("It's already been handed in, so it can't be removed.", 409);
  await payload.delete({ collection: "assignments", id: a.id, overrideAccess: true });
}

/* ------------------------------------------------------------------ goals */

export type GoalInput = { title?: string; targetDate?: string | null; milestones?: { text: string; done?: boolean }[]; status?: "active" | "achieved" | "archived" };

export const goalView = (g: Goal) => ({
  id: g.id,
  title: g.title,
  status: g.status,
  targetDate: g.targetDate ?? null,
  achievedAt: g.achievedAt ?? null,
  milestones: (g.milestones ?? []).map((m) => ({ text: m.text, done: Boolean(m.done) })),
  progress: (g.milestones ?? []).length ? Math.round(((g.milestones ?? []).filter((m) => m.done).length / (g.milestones ?? []).length) * 100) : g.status === "achieved" ? 100 : 0,
});
export type GoalView = ReturnType<typeof goalView>;

async function goalOwnerCheck(payload: Payload, user: User, studentId: number) {
  if (user.role === "student" && user.id === studentId) return;
  if (user.role === "tutor" && (await teaches(payload, user.id, studentId))) return;
  throw new BookingError("Not allowed.", 403);
}

function cleanGoal(input: GoalInput, prev?: Goal) {
  const data: Record<string, unknown> = {};
  if (input.title !== undefined) {
    const t = String(input.title).trim().slice(0, 140);
    if (!t) throw new BookingError("Give your goal a name.");
    data.title = t;
  }
  if (input.targetDate !== undefined) data.targetDate = input.targetDate && Number.isFinite(Date.parse(input.targetDate)) ? new Date(input.targetDate).toISOString() : null;
  if (Array.isArray(input.milestones)) {
    const before = new Map((prev?.milestones ?? []).map((m) => [m.text, m]));
    data.milestones = input.milestones
      .map((m) => ({ text: String(m?.text ?? "").trim().slice(0, 160), done: Boolean(m?.done) }))
      .filter((m) => m.text)
      .slice(0, 12)
      .map((m) => ({ ...m, doneAt: m.done ? (before.get(m.text)?.doneAt ?? new Date().toISOString()) : null }));
  }
  if (input.status && ["active", "achieved", "archived"].includes(input.status)) {
    data.status = input.status;
    data.achievedAt = input.status === "achieved" ? (prev?.achievedAt ?? new Date().toISOString()) : null;
  }
  return data;
}

export async function listGoals(payload: Payload, user: User, studentId: number) {
  await goalOwnerCheck(payload, user, studentId);
  const r = await payload.find({ collection: "goals", where: { and: [{ student: { equals: studentId } }, { status: { not_equals: "archived" } }] }, sort: "-updatedAt", limit: 50, depth: 0, overrideAccess: true });
  return r.docs.map(goalView);
}

export async function createGoal(payload: Payload, user: User, studentId: number, input: GoalInput) {
  await goalOwnerCheck(payload, user, studentId);
  const count = await payload.count({ collection: "goals", where: { and: [{ student: { equals: studentId } }, { status: { equals: "active" } }] }, overrideAccess: true });
  if (count.totalDocs >= 10) throw new BookingError("You can work on up to 10 goals at a time. Mark one as achieved first.");
  const data = cleanGoal({ status: "active", ...input });
  if (!data.title) throw new BookingError("Give your goal a name.");
  const g = await payload.create({ collection: "goals", data: { ...data, student: studentId, createdBy: user.id } as never, overrideAccess: true });
  return goalView(g);
}

export async function updateGoal(payload: Payload, user: User, id: number, input: GoalInput) {
  const g = await payload.findByID({ collection: "goals", id, depth: 0, overrideAccess: true }).catch(() => null);
  if (!g) throw new BookingError("Not found.", 404);
  await goalOwnerCheck(payload, user, idOf(g.student)!);
  const updated = await payload.update({ collection: "goals", id: g.id, data: cleanGoal(input, g) as never, overrideAccess: true });
  return goalView(updated);
}

/* ------------------------------------------------------------------ parent view */

async function profileOf(payload: Payload, student: User) {
  const r = await payload.find({ collection: "student-profiles", where: { user: { equals: student.id } }, limit: 1, depth: 0, overrideAccess: true, showHiddenFields: true });
  return r.docs[0] ?? (await payload.create({ collection: "student-profiles", data: { user: student.id } as never, overrideAccess: true }));
}

export async function shareStatus(payload: Payload, student: User) {
  const p = await profileOf(payload, student);
  return { token: (p as { shareToken?: string | null }).shareToken ?? null, createdAt: (p as { shareCreatedAt?: string | null }).shareCreatedAt ?? null };
}

/** Make (or replace) the private parent link. Replacing it stops the old link working. */
export async function createShare(payload: Payload, student: User) {
  if (student.role !== "student") throw new BookingError("Only students can share their progress.", 403);
  const p = await profileOf(payload, student);
  const token = crypto.randomBytes(24).toString("base64url");
  await payload.update({ collection: "student-profiles", id: p.id, data: { shareToken: token, shareCreatedAt: new Date().toISOString() } as never, overrideAccess: true });
  return token;
}

export async function revokeShare(payload: Payload, student: User) {
  const p = await profileOf(payload, student);
  await payload.update({ collection: "student-profiles", id: p.id, data: { shareToken: null, shareCreatedAt: null } as never, overrideAccess: true });
}

/** Read-only summary for a parent. No contact details, messages or payments. */
export async function parentView(payload: Payload, token: string) {
  if (!/^[A-Za-z0-9_-]{24,64}$/.test(token)) return null;
  const r = await payload.find({ collection: "student-profiles", where: { shareToken: { equals: token } }, limit: 1, depth: 1, overrideAccess: true, showHiddenFields: true });
  const profile = r.docs[0];
  const student = profile && typeof profile.user === "object" ? (profile.user as User) : null;
  if (!student) return null;
  const [lessons, assignments, goals] = await Promise.all([
    payload.find({ collection: "bookings", where: { and: [{ student: { equals: student.id } }, { status: { in: ["confirmed", "completed", "no_show"] } }] }, sort: "-startsAt", limit: 500, depth: 1, overrideAccess: true, pagination: false }),
    payload.find({ collection: "assignments", where: { student: { equals: student.id } }, sort: "-createdAt", limit: 30, depth: 1, overrideAccess: true }),
    payload.find({ collection: "goals", where: { and: [{ student: { equals: student.id } }, { status: { not_equals: "archived" } }] }, sort: "-updatedAt", limit: 20, depth: 0, overrideAccess: true }),
  ]);
  const now = Date.now();
  const done = lessons.docs.filter((b) => b.status === "completed");
  const missed = lessons.docs.filter((b) => b.status === "no_show" && b.noShowBy === "student");
  const tutorName = (t: unknown) => (t && typeof t === "object" ? ((t as TutorProfile).displayName ?? "Tutor") : "Tutor");
  const subjectName = (s: unknown) => (s && typeof s === "object" ? (s as Subject).name : null);
  return {
    firstName: student.firstName ?? "Your child",
    timezone: student.timezone ?? "UTC",
    stats: { lessons: done.length, hours: Math.round((done.reduce((n, b) => n + b.minutes, 0) / 60) * 10) / 10, missed: missed.length, homeworkDone: assignments.docs.filter((a) => a.status !== "assigned").length, homeworkSet: assignments.docs.length },
    upcoming: lessons.docs
      .filter((b) => b.status === "confirmed" && Date.parse(b.startsAt) > now)
      .reverse()
      .slice(0, 5)
      .map((b) => ({ id: b.id, startsAt: b.startsAt, endsAt: b.endsAt, tutor: tutorName(b.tutor), subject: subjectName(b.subject) })),
    recent: lessons.docs
      .filter((b) => Date.parse(b.startsAt) <= now && b.status !== "confirmed")
      .slice(0, 10)
      .map((b) => ({ id: b.id, startsAt: b.startsAt, tutor: tutorName(b.tutor), subject: subjectName(b.subject), attended: b.status === "completed", notes: lexicalToText(b.tutorNotes).slice(0, 400) || null })),
    homework: assignments.docs.map((a) => ({ id: a.id, title: a.title, kind: a.kind, status: a.status, dueAt: a.dueAt ?? null, score: a.score ?? null, outOf: a.outOf ?? null, tutor: a.tutorUser && typeof a.tutorUser === "object" ? shortName(a.tutorUser as User) : "Tutor", late: a.status === "assigned" && Boolean(a.dueAt && Date.parse(a.dueAt) < now) })),
    goals: goals.docs.map(goalView),
  };
}
export type ParentView = NonNullable<Awaited<ReturnType<typeof parentView>>>;

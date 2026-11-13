import "server-only";
import { AccessToken } from "livekit-server-sdk";
import type { Payload } from "payload";
import type { Booking, Subject, TutorProfile, User } from "@/payload-types";
import { getPolicies } from "../tutors/server";
import { BookingError } from "../scheduling/server";
import { lexicalToText, toSafeLexical, type Lexical } from "../content/rich";

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === "object" ? ((v as { id: number }).id ?? null) : Number(v));
const LATE_JOIN_MIN = 15; // the room stays open this long after the scheduled end
const SETTLE_AFTER_MIN = 30; // attendance is settled this long after the end
const REPORT_WINDOW_H = 48;

export const videoConfigured = () => Boolean(process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET && process.env.NEXT_PUBLIC_LIVEKIT_URL);

export function joinWindow(b: Pick<Booking, "startsAt" | "endsAt">, earlyMinutes: number) {
  return { opens: Date.parse(b.startsAt) - earlyMinutes * 60_000, closes: Date.parse(b.endsAt) + LATE_JOIN_MIN * 60_000 };
}

export async function lessonFor(payload: Payload, user: User, id: number) {
  const b = await payload.findByID({ collection: "bookings", id, depth: 2, overrideAccess: true }).catch(() => null);
  if (!b) return null;
  const role = idOf(b.student) === user.id ? "student" : idOf(b.tutorUser) === user.id ? "tutor" : null;
  if (!role) return null;
  return { b, role: role as "student" | "tutor" };
}

/** A LiveKit token for the lesson room; records that this person turned up. */
export async function joinLesson(payload: Payload, user: User, id: number) {
  const found = await lessonFor(payload, user, id);
  if (!found) throw new BookingError("Lesson not found.", 404);
  const { b, role } = found;
  if (b.status !== "confirmed") throw new BookingError(b.status === "requested" ? "The tutor hasn't accepted this lesson yet." : "This lesson isn't taking place.", 409);
  const policies = await getPolicies(payload);
  const w = joinWindow(b, policies.classroomEarlyJoinMinutes);
  const now = Date.now();
  if (now < w.opens) throw new BookingError(`The classroom opens ${policies.classroomEarlyJoinMinutes} minutes before the lesson.`, 409);
  if (now > w.closes) throw new BookingError("This lesson has ended.", 409);
  if (!videoConfigured()) throw new BookingError("Video isn't set up on this site yet. Please contact support.", 503);

  const field = role === "student" ? "studentJoinedAt" : "tutorJoinedAt";
  if (!b[field]) await payload.update({ collection: "bookings", id: b.id, data: { [field]: new Date().toISOString() }, overrideAccess: true });

  const name = role === "tutor" ? ((b.tutor as TutorProfile).displayName ?? user.firstName ?? "Tutor") : `${user.firstName ?? "Student"}${user.lastName ? ` ${user.lastName.charAt(0)}.` : ""}`;
  const at = new AccessToken(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!, {
    identity: `${role}-${user.id}`,
    name,
    metadata: JSON.stringify({ role }),
    ttl: Math.max(600, Math.ceil((w.closes - now) / 1000)),
  });
  at.addGrant({ room: `lesson-${b.id}`, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true });
  const { recordingAvailable, recordingState } = await import("./classroom");
  return { token: await at.toJwt(), url: process.env.NEXT_PUBLIC_LIVEKIT_URL!, role, endsAt: b.endsAt, recording: recordingState(b, await recordingAvailable(payload)) };
}

/**
 * After a lesson, decide what happened from classroom attendance: the tutor joined → completed
 * (the student not turning up is still a paid lesson); the tutor never joined → tutor no-show and
 * the student is refunded in full. Runs with the other housekeeping when lists load.
 */
export async function settleAttendance(payload: Payload) {
  const cutoff = new Date(Date.now() - SETTLE_AFTER_MIN * 60_000).toISOString();
  const due = await payload.find({ collection: "bookings", where: { and: [{ status: { equals: "confirmed" } }, { endsAt: { less_than: cutoff } }] }, limit: 200, depth: 0, overrideAccess: true });
  for (const b of due.docs) {
    if (b.tutorJoinedAt) {
      await markCompleted(payload, b, null);
    } else {
      await payload.update({
        collection: "bookings",
        id: b.id,
        data: { status: "no_show", noShowBy: "tutor", history: [...(b.history ?? []), { action: "tutor no-show", at: new Date().toISOString() }] } as never,
        overrideAccess: true,
      });
      const { refundBooking } = await import("../payments/server");
      await refundBooking(payload, b.id, 100, "The tutor didn't join the lesson").catch((err) => payload.logger.error({ err }, "[lessons] refund failed"));
    }
  }
}

async function markCompleted(payload: Payload, b: Booking, notes: Lexical | null | undefined) {
  await payload.update({
    collection: "bookings",
    id: b.id,
    data: {
      status: "completed",
      completedAt: new Date().toISOString(),
      noShowBy: b.studentJoinedAt ? null : "student",
      ...(notes !== undefined ? { tutorNotes: notes } : {}),
      history: [...(b.history ?? []), { action: "completed", at: new Date().toISOString() }],
    } as never,
    overrideAccess: true,
  });
  // Tutor stats: lessons taught and distinct students.
  const tutorId = idOf(b.tutor)!;
  const done = await payload.find({ collection: "bookings", where: { and: [{ tutor: { equals: tutorId } }, { status: { equals: "completed" } }] }, limit: 10000, pagination: false, depth: 0, select: { student: true }, overrideAccess: true });
  const t = await payload.findByID({ collection: "tutor-profiles", id: tutorId, depth: 0, overrideAccess: true });
  await payload.update({
    collection: "tutor-profiles",
    id: tutorId,
    data: { stats: { ...(t.stats ?? {}), lessonsTaught: done.docs.length, studentsTaught: new Set(done.docs.map((d) => idOf(d.student))).size } } as never,
    overrideAccess: true,
    context: { skipTutorChecks: true },
  });
}

/** Tutor finishes the lesson (from the classroom or the lesson page), optionally with notes. */
export async function finishLesson(payload: Payload, user: User, id: number, notes: unknown) {
  const found = await lessonFor(payload, user, id);
  if (!found || found.role !== "tutor") throw new BookingError("Lesson not found.", 404);
  const { b } = found;
  let clean: Lexical | null;
  try {
    clean = toSafeLexical(notes, 2000, "Lesson notes");
  } catch (e) {
    throw new BookingError((e as Error).message);
  }
  if (b.status === "completed") {
    await payload.update({ collection: "bookings", id: b.id, data: { tutorNotes: clean }, overrideAccess: true });
    return;
  }
  if (b.status !== "confirmed") throw new BookingError("This lesson isn't taking place.", 409);
  if (Date.parse(b.startsAt) > Date.now()) throw new BookingError("You can finish a lesson once it has started.", 409);
  await markCompleted(payload, { ...b, tutorJoinedAt: b.tutorJoinedAt ?? new Date().toISOString() }, clean);
}

export async function reportProblem(payload: Payload, user: User, id: number, text: string) {
  const found = await lessonFor(payload, user, id);
  if (!found) throw new BookingError("Lesson not found.", 404);
  const { b } = found;
  const clean = text.trim().slice(0, 2000);
  if (clean.length < 10) throw new BookingError("Please tell us a little more about what happened.");
  if (Date.parse(b.startsAt) > Date.now()) throw new BookingError("You can report a problem once the lesson has started.", 409);
  if (Date.now() > Date.parse(b.endsAt) + REPORT_WINDOW_H * 3600_000) throw new BookingError(`Problems can be reported up to ${REPORT_WINDOW_H} hours after a lesson. Please contact support.`, 409);
  if (b.issue?.reportedAt) throw new BookingError("You've already reported a problem with this lesson. We'll be in touch.", 409);
  await payload.update({ collection: "bookings", id: b.id, data: { issue: { text: `[${found.role}] ${clean}`, reportedAt: new Date().toISOString(), resolved: false } }, overrideAccess: true });
}

export async function submitReview(payload: Payload, user: User, id: number, rating: number, comment: string) {
  const found = await lessonFor(payload, user, id);
  if (!found || found.role !== "student") throw new BookingError("Lesson not found.", 404);
  const { b } = found;
  if (b.status !== "completed") throw new BookingError("You can review a lesson once it's finished.", 409);
  const r = Math.round(Number(rating));
  if (!(r >= 1 && r <= 5)) throw new BookingError("Choose 1 to 5 stars.");
  const exists = await payload.count({ collection: "reviews", where: { booking: { equals: b.id } }, overrideAccess: true });
  if (exists.totalDocs) throw new BookingError("You've already reviewed this lesson.", 409);
  const review = await payload.create({
    collection: "reviews",
    data: {
      rating: r,
      comment: comment.trim().slice(0, 1500),
      status: "published",
      booking: b.id,
      tutor: idOf(b.tutor)!,
      student: user.id,
      studentName: `${user.firstName ?? "Student"}${user.lastName ? ` ${user.lastName.charAt(0)}.` : ""}`,
      subject: (b.subject as Subject | null)?.name ?? null,
    },
    overrideAccess: true,
  });
  const tutorUser = await payload.findByID({ collection: "users", id: idOf(b.tutorUser)!, depth: 0, overrideAccess: true }).catch(() => null);
  if (tutorUser) {
    const [{ deliver }, { reviewReceived }, { personOf }] = await Promise.all([import("../notify/server"), import("../email/notices"), import("../scheduling/server")]);
    void deliver(payload, tutorUser, reviewReceived(personOf(tutorUser), review.studentName ?? "A student", r, review.comment ?? ""));
  }
  return review;
}

/** Day-before and hour-before reminders for confirmed lessons. Each is claimed before sending, so it goes once. */
export async function sendReminders(payload: Payload) {
  const now = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();
  const jobs = [
    { field: "remindedDayAt" as const, soon: false, from: now + 20 * 3600_000, to: now + 25 * 3600_000 },
    { field: "remindedHourAt" as const, soon: true, from: now, to: now + 70 * 60_000 },
  ];
  const { mailContext, personOf } = await import("../scheduling/server");
  const [{ deliver }, { lessonReminder }] = await Promise.all([import("../notify/server"), import("../email/notices")]);
  for (const j of jobs) {
    const claimed = await payload.update({
      collection: "bookings",
      where: { and: [{ status: { equals: "confirmed" } }, { startsAt: { greater_than: iso(j.from) } }, { startsAt: { less_than_equal: iso(j.to) } }, { [j.field]: { exists: false } }] },
      data: { [j.field]: iso(now) },
      overrideAccess: true,
      depth: 0,
      limit: 100,
    });
    for (const b of claimed.docs) {
      // Just booked: the confirmation email already covers it.
      if (Date.parse(b.createdAt) > now - (j.soon ? 15 : 120) * 60_000) continue;
      const ctx = await mailContext(payload, b);
      const lesson = { ...ctx.lesson, id: b.id };
      await deliver(payload, ctx.student, lessonReminder(lesson, personOf(ctx.student), "student", j.soon));
      await deliver(payload, ctx.tutorUser, lessonReminder(lesson, personOf(ctx.tutorUser), "tutor", j.soon));
    }
  }
}

export async function replyToReview(payload: Payload, user: User, reviewId: number, reply: string) {
  const r = await payload.findByID({ collection: "reviews", id: reviewId, depth: 1, overrideAccess: true }).catch(() => null);
  const tutor = r && typeof r.tutor === "object" ? r.tutor : null;
  if (!r || !tutor || idOf(tutor.user) !== user.id) throw new BookingError("Review not found.", 404);
  await payload.update({ collection: "reviews", id: r.id, data: { tutorReply: reply.trim().slice(0, 1000) || null }, overrideAccess: true });
}

/* ------------------------------------------------------------------ views */

export async function publicReviews(payload: Payload, tutorId: number, limit = 6) {
  const r = await payload.find({ collection: "reviews", where: { and: [{ tutor: { equals: tutorId } }, { status: { equals: "published" } }] }, sort: "-createdAt", limit, depth: 0, overrideAccess: true });
  return { total: r.totalDocs, items: r.docs.map((d) => ({ id: d.id, rating: d.rating, comment: d.comment ?? "", reply: d.tutorReply ?? null, name: d.studentName ?? "Student", subject: d.subject ?? null, date: d.createdAt })) };
}

export async function tutorReviews(payload: Payload, user: User) {
  const t = (await payload.find({ collection: "tutor-profiles", where: { user: { equals: user.id } }, limit: 1, depth: 0, overrideAccess: true })).docs[0];
  if (!t) return { rating: 0, total: 0, items: [], breakdown: [0, 0, 0, 0, 0] };
  const r = await payload.find({ collection: "reviews", where: { tutor: { equals: t.id } }, sort: "-createdAt", limit: 500, depth: 0, overrideAccess: true });
  const breakdown = [5, 4, 3, 2, 1].map((s) => r.docs.filter((d) => d.status === "published" && d.rating === s).length);
  return {
    rating: t.stats?.rating ?? 0,
    total: t.stats?.reviewCount ?? 0,
    breakdown,
    items: r.docs.map((d) => ({ id: d.id, rating: d.rating, comment: d.comment ?? "", reply: d.tutorReply ?? "", name: d.studentName ?? "Student", subject: d.subject ?? null, date: d.createdAt, hidden: d.status === "hidden" })),
  };
}

/** Students a tutor has taught or will teach, with counts. */
export async function tutorStudents(payload: Payload, user: User) {
  const r = await payload.find({ collection: "bookings", where: { and: [{ tutorUser: { equals: user.id } }, { status: { in: ["confirmed", "completed", "requested"] } }] }, sort: "startsAt", limit: 5000, pagination: false, depth: 1, overrideAccess: true });
  const now = Date.now();
  const map = new Map<number, { id: number; name: string; avatar: string | null; done: number; minutes: number; next: string | null; last: string | null; subjects: Set<string> }>();
  for (const b of r.docs) {
    const s = b.student as User;
    if (!s || typeof s !== "object") continue;
    const e = map.get(s.id) ?? { id: s.id, name: `${s.firstName ?? ""} ${s.lastName?.charAt(0) ?? ""}.`.trim(), avatar: null, done: 0, minutes: 0, next: null, last: null, subjects: new Set<string>() };
    if (b.status === "completed") {
      e.done++;
      e.minutes += b.minutes;
      e.last = b.startsAt;
    } else if (Date.parse(b.startsAt) > now && !e.next) e.next = b.startsAt;
    const sub = (b.subject as Subject | null)?.name;
    if (sub) e.subjects.add(sub);
    map.set(s.id, e);
  }
  return [...map.values()].map((e) => ({ ...e, subjects: [...e.subjects] })).sort((a, b) => (b.next ? 1 : 0) - (a.next ? 1 : 0) || b.done - a.done);
}

/** A student's learning so far. */
export async function studentProgress(payload: Payload, user: User) {
  const r = await payload.find({ collection: "bookings", where: { and: [{ student: { equals: user.id } }, { status: { in: ["completed", "confirmed"] } }] }, sort: "-startsAt", limit: 5000, pagination: false, depth: 1, overrideAccess: true });
  const done = r.docs.filter((b) => b.status === "completed");
  const bySubject = new Map<string, number>();
  for (const b of done) bySubject.set((b.subject as Subject | null)?.name ?? "Other", (bySubject.get((b.subject as Subject | null)?.name ?? "Other") ?? 0) + b.minutes);
  // Weeks in a row with at least one finished lesson, counting back from this week.
  const week = (t: number) => Math.floor((t + 3 * 86400_000) / (7 * 86400_000));
  const weeks = new Set(done.map((b) => week(Date.parse(b.startsAt))));
  let streak = 0;
  for (let w = week(Date.now()); weeks.has(w) || (w === week(Date.now()) && weeks.has(w - 1)); w--) if (weeks.has(w)) streak++;
  const reviewed = new Set((await payload.find({ collection: "reviews", where: { student: { equals: user.id } }, limit: 5000, pagination: false, depth: 0, select: { booking: true }, overrideAccess: true })).docs.map((d) => idOf(d.booking)));
  return {
    lessons: done.length,
    minutes: done.reduce((n, b) => n + b.minutes, 0),
    tutors: new Set(done.map((b) => idOf(b.tutor))).size,
    streak,
    subjects: [...bySubject.entries()].map(([name, minutes]) => ({ name, minutes })).sort((a, b) => b.minutes - a.minutes),
    notes: done
      .filter((b) => b.tutorNotes)
      .slice(0, 10)
      .map((b) => ({ id: b.id, date: b.startsAt, tutor: (b.tutor as TutorProfile)?.displayName ?? "Tutor", subject: (b.subject as Subject | null)?.name ?? null, notes: lexicalToText(b.tutorNotes) })),
    toReview: done.filter((b) => !reviewed.has(b.id)).slice(0, 3).map((b) => ({ id: b.id, tutor: (b.tutor as TutorProfile)?.displayName ?? "Tutor", date: b.startsAt })),
  };
}

/** Everything the lesson page shows, for the student or tutor of the lesson. */
export async function lessonDetail(payload: Payload, user: User, id: number) {
  const { expireStale } = await import("../scheduling/server");
  await expireStale(payload).catch(() => undefined);
  const found = await lessonFor(payload, user, id);
  if (!found) return null;
  const { b, role } = found;
  const policies = await getPolicies(payload);
  const tutor = b.tutor as TutorProfile;
  const student = b.student as User;
  const media = (m: unknown) => (m && typeof m === "object" ? ((m as { sizes?: { thumb?: { url?: string } }; url?: string }).sizes?.thumb?.url ?? (m as { url?: string }).url ?? null) : null);
  const review = (await payload.find({ collection: "reviews", where: { booking: { equals: b.id } }, limit: 1, depth: 0, overrideAccess: true })).docs[0] ?? null;
  const payment = role === "student" ? ((await payload.find({ collection: "payments", where: { and: [{ booking: { equals: b.id } }, { status: { in: ["succeeded", "refunded", "partially_refunded"] } }] }, limit: 1, depth: 0, overrideAccess: true })).docs[0] ?? null) : null;
  const w = joinWindow(b, policies.classroomEarlyJoinMinutes);
  const now = Date.now();
  return {
    id: b.id,
    role,
    reference: b.reference ?? "",
    status: b.status,
    kind: b.kind,
    minutes: b.minutes,
    subject: (b.subject as Subject | null)?.name ?? null,
    title: b.kind === "trial" ? `Trial lesson${(b.subject as Subject | null)?.name ? ` · ${(b.subject as Subject).name}` : ""}` : ((b.subject as Subject | null)?.name ?? "Lesson"),
    startsAt: b.startsAt,
    endsAt: b.endsAt,
    joinOpensAt: new Date(w.opens).toISOString(),
    joinClosesAt: new Date(w.closes).toISOString(),
    classroom: b.status === "confirmed" && now <= w.closes,
    other: role === "student" ? { name: tutor?.displayName ?? "Tutor", avatar: media(tutor?.photo), href: tutor?.slug ? `/tutors/${tutor.slug}` : null } : { name: `${student?.firstName ?? "Student"}${student?.lastName ? ` ${student.lastName.charAt(0)}.` : ""}`, avatar: media(student?.avatar), href: null },
    messageHref: role === "student" ? `/student/messages?tutor=${tutor?.id}` : `/tutor/messages?student=${student?.id}`,
    me: { name: role === "tutor" ? (tutor?.displayName ?? "You") : `${user.firstName ?? "You"}`, avatar: media(role === "tutor" ? tutor?.photo : user.avatar) },
    note: b.studentNote ?? null,
    tutorNotes: (b.tutorNotes as Lexical | null) ?? null,
    noShowBy: b.noShowBy ?? null,
    cancelReason: b.cancelReason ?? null,
    review: review ? { rating: review.rating, comment: review.comment ?? "", reply: review.tutorReply ?? null } : null,
    canReview: role === "student" && b.status === "completed" && !review,
    canReport: !b.issue?.reportedAt && now >= Date.parse(b.startsAt) && now <= Date.parse(b.endsAt) + REPORT_WINDOW_H * 3600_000 && ["confirmed", "completed", "no_show"].includes(b.status),
    reported: Boolean(b.issue?.reportedAt),
    canFinish: role === "tutor" && (b.status === "confirmed" || b.status === "completed") && now >= Date.parse(b.startsAt),
    price: b.price,
    refunded: b.refundedAmount ?? 0,
    currency: b.currency,
    paymentId: payment?.id ?? null,
    files: ["confirmed", "completed", "requested", "no_show"].includes(b.status),
    recordingReady: b.recording?.status === "ready" && Boolean(b.recording?.fileKey),
  };
}
export type LessonDetailView = NonNullable<Awaited<ReturnType<typeof lessonDetail>>>;

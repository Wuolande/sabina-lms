import "server-only";
import { sql } from "@payloadcms/db-postgres";
import type { Payload, PayloadRequest, Where } from "payload";
import type { Booking, Media, Schedule, Subject, TutorProfile, User } from "@/payload-types";
import { safeTz } from "@/lib/time";
import { HOLDING, type BookingStatus } from "../collections/Bookings";
import { bookedConfirmed, bookingRequested, lessonCancelled, requestAccepted, requestDeclined, type MailLesson, type MailPerson } from "../email/booking";
import { getPolicies } from "../tutors/server";
import { computeSlots, withinHours, type WeeklyRange } from "./slots";

export class BookingError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

type Policies = Awaited<ReturnType<typeof getPolicies>>;
const idOf = (v: unknown): number | null => (v == null ? null : typeof v === "object" ? ((v as { id: number }).id ?? null) : Number(v));
const round2 = (n: number) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ schedule */

export async function ownSchedule(payload: Payload, user: User): Promise<Schedule> {
  const found = await payload.find({ collection: "schedules", where: { user: { equals: user.id } }, limit: 1, depth: 0, overrideAccess: true });
  if (found.docs[0]) return found.docs[0];
  try {
    return await payload.create({ collection: "schedules", data: { user: user.id, timezone: safeTz(user.timezone), weekly: [], timeOff: [], label: user.name ?? user.email } as never, user, overrideAccess: false });
  } catch (err) {
    const again = await payload.find({ collection: "schedules", where: { user: { equals: user.id } }, limit: 1, depth: 0, overrideAccess: true });
    if (again.docs[0]) return again.docs[0];
    throw err;
  }
}

async function scheduleFor(payload: Payload, tutor: TutorProfile, req?: Partial<PayloadRequest>) {
  const r = await payload.find({ collection: "schedules", where: { user: { equals: idOf(tutor.user) } }, limit: 1, depth: 0, overrideAccess: true, req });
  return r.docs[0] ?? null;
}

/* ------------------------------------------------------------------ pricing & options */

export function lessonPrice(tutor: Pick<TutorProfile, "hourlyRate">, policies: Policies, kind: "trial" | "regular", minutes: number) {
  const rate = tutor.hourlyRate ?? 0;
  if (kind === "trial") return round2(((rate * policies.trialLessonMinutes) / 60) * (1 - policies.trialLessonDiscountPercent / 100));
  return round2((rate * minutes) / 60);
}

async function hadTrial(payload: Payload, studentId: number, tutorId: number, req?: Partial<PayloadRequest>) {
  const r = await payload.count({ collection: "bookings", where: { and: [{ student: { equals: studentId } }, { tutor: { equals: tutorId } }, { kind: { equals: "trial" } }, { status: { in: ["requested", "confirmed", "completed", "no_show"] } }] }, overrideAccess: true, req });
  return r.totalDocs > 0;
}

export type LessonOption = { kind: "trial" | "regular"; minutes: number; price: number; label: string };

export async function bookingOptions(payload: Payload, tutor: TutorProfile, policies: Policies, studentId?: number | null): Promise<LessonOption[]> {
  const opts: LessonOption[] = [];
  if (tutor.offersTrial && !(studentId && (await hadTrial(payload, studentId, tutor.id)))) {
    opts.push({ kind: "trial", minutes: policies.trialLessonMinutes, price: lessonPrice(tutor, policies, "trial", policies.trialLessonMinutes), label: "Trial lesson" });
  }
  for (const m of policies.regularLessonMinutes as number[]) opts.push({ kind: "regular", minutes: m, price: lessonPrice(tutor, policies, "regular", m), label: `${m} minutes` });
  return opts;
}

export const instantFor = (tutor: TutorProfile, schedule: Schedule | null, policies: Policies) => Boolean(policies.instantBookingEnabled && (schedule ? schedule.instantBooking : tutor.instantBooking));

/* ------------------------------------------------------------------ slots */

export async function busyFor(payload: Payload, where: Where, from: number, to: number, req?: Partial<PayloadRequest>) {
  const r = await payload.find({
    collection: "bookings",
    where: { and: [where, { status: { in: HOLDING } }, { startsAt: { less_than: new Date(to).toISOString() } }, { endsAt: { greater_than: new Date(from).toISOString() } }] },
    limit: 1000,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    req,
  });
  return r.docs.map((b) => ({ id: b.id, start: Date.parse(b.startsAt), end: Date.parse(b.endsAt) }));
}

/** Open start times for a tutor. When a student is given, their own lessons are blocked out too. */
export async function openSlots(payload: Payload, tutor: TutorProfile, minutes: number, policies: Policies, studentId?: number | null) {
  await expireStale(payload).catch(() => undefined);
  const schedule = await scheduleFor(payload, tutor);
  const timezone = safeTz(schedule?.timezone ?? tutor.timezone);
  if (!schedule?.weekly?.length) return { timezone, slots: [] as number[], hasHours: false, instant: instantFor(tutor, schedule, policies) };
  const now = Date.now();
  const to = now + policies.bookingWindowDays * 86400_000 + 86400_000;
  const busy = await busyFor(payload, { tutor: { equals: tutor.id } }, now, to);
  if (studentId) busy.push(...(await busyFor(payload, { student: { equals: studentId } }, now, to)));
  const slots = computeSlots({
    timezone,
    weekly: schedule.weekly as WeeklyRange[],
    timeOff: (schedule.timeOff ?? []) as { from: string; to: string }[],
    busy,
    minutes,
    noticeHours: schedule.noticeHours ?? tutor.noticeHours ?? 12,
    bufferMinutes: schedule.bufferMinutes ?? 0,
    windowDays: policies.bookingWindowDays,
    now,
  });
  return { timezone, slots, hasHours: true, instant: instantFor(tutor, schedule, policies) };
}

/* ------------------------------------------------------------------ locking */

/** Run `fn` in a transaction holding advisory locks, so two people can't take the same time. */
export async function withLocks<T>(payload: Payload, keys: [number, number][], fn: (req: Partial<PayloadRequest>) => Promise<T>): Promise<T> {
  const transactionID = (await payload.db.beginTransaction()) as string | number;
  const req: Partial<PayloadRequest> = { transactionID };
  try {
    const db = (payload.db as unknown as { sessions: Record<string, { db: { execute: (q: unknown) => Promise<unknown> } }> }).sessions[String(transactionID)].db;
    for (const [a, b] of keys) await db.execute(sql`select pg_advisory_xact_lock(${a}::int, ${b}::int)`);
    const out = await fn(req);
    await payload.db.commitTransaction(transactionID);
    return out;
  } catch (err) {
    await payload.db.rollbackTransaction(transactionID).catch(() => undefined);
    throw err;
  }
}

/* ------------------------------------------------------------------ mail */

export const personOf = (u: User): MailPerson => ({ email: u.email, firstName: u.firstName, timezone: u.timezone });
const shortName = (u: Pick<User, "firstName" | "lastName" | "name" | "email">) => (u.firstName ? `${u.firstName}${u.lastName ? ` ${u.lastName.charAt(0)}.` : ""}` : (u.name ?? u.email.split("@")[0]));

export async function mailContext(payload: Payload, b: Booking) {
  const [student, tutorUser, tutor, subject] = await Promise.all([
    payload.findByID({ collection: "users", id: idOf(b.student)!, depth: 0, overrideAccess: true }),
    payload.findByID({ collection: "users", id: idOf(b.tutorUser)!, depth: 0, overrideAccess: true }),
    payload.findByID({ collection: "tutor-profiles", id: idOf(b.tutor)!, depth: 0, overrideAccess: true }),
    b.subject ? payload.findByID({ collection: "subjects", id: idOf(b.subject)!, depth: 0, overrideAccess: true }).catch(() => null) : null,
  ]);
  const lesson: MailLesson = { reference: b.reference ?? "", startsAt: b.startsAt, endsAt: b.endsAt, minutes: b.minutes, subject: subject?.name, kind: b.kind, studentName: shortName(student), tutorName: tutor.displayName ?? shortName(tutorUser), note: b.studentNote, reason: b.cancelReason };
  return { student, tutorUser, lesson };
}

export function send(payload: Payload, to: string, mail: { subject: string; html: string }) {
  return payload.sendEmail({ to, subject: mail.subject, html: mail.html }).catch((err: unknown) => payload.logger.error({ err }, "[bookings] email failed"));
}

/* ------------------------------------------------------------------ create */

export async function createBooking(
  payload: Payload,
  student: User,
  input: { tutorId: number; startsAt: string; kind: "trial" | "regular"; minutes: number; subjectId?: number | null; note?: string; timezone?: string },
) {
  if (student.role !== "student") throw new BookingError("Only student accounts can book lessons.", 403);
  await expireStale(payload).catch(() => undefined);
  const policies = await getPolicies(payload);
  const tutor = await payload.findByID({ collection: "tutor-profiles", id: input.tutorId, depth: 0, overrideAccess: true }).catch(() => null);
  if (!tutor || tutor.status !== "approved") throw new BookingError("This tutor isn't taking bookings right now.", 404);
  if (idOf(tutor.user) === student.id) throw new BookingError("You can't book yourself.");

  const kind = input.kind === "trial" ? "trial" : "regular";
  const minutes = kind === "trial" ? policies.trialLessonMinutes : Number(input.minutes);
  if (kind === "regular" && !(policies.regularLessonMinutes as number[]).includes(minutes)) throw new BookingError("Choose a lesson length.");
  if (kind === "trial" && !tutor.offersTrial) throw new BookingError("This tutor doesn't offer trial lessons.");
  const start = Date.parse(input.startsAt);
  if (!Number.isFinite(start)) throw new BookingError("Choose a time.");
  const end = start + minutes * 60_000;

  const subjects = (tutor.subjects ?? []).map(idOf);
  const subjectId = input.subjectId && subjects.includes(Number(input.subjectId)) ? Number(input.subjectId) : idOf(tutor.primarySubject);

  const schedule = await scheduleFor(payload, tutor);
  if (!schedule?.weekly?.length) throw new BookingError("This tutor hasn't opened their calendar yet.");
  const tz = safeTz(schedule.timezone);
  const notice = schedule.noticeHours ?? 12;
  if (start < Date.now() + notice * 3600_000) throw new BookingError(`Please book at least ${notice} hour${notice === 1 ? "" : "s"} ahead.`, 409);
  if (start > Date.now() + (policies.bookingWindowDays + 1) * 86400_000) throw new BookingError(`You can book up to ${policies.bookingWindowDays} days ahead.`);
  if (!withinHours({ timezone: tz, weekly: schedule.weekly as WeeklyRange[], timeOff: (schedule.timeOff ?? []) as { from: string; to: string }[], start, minutes })) {
    throw new BookingError("That time is outside the tutor's hours. Please pick another time.", 409);
  }
  const buffer = (schedule.bufferMinutes ?? 0) * 60_000;
  const instant = instantFor(tutor, schedule, policies);

  const booking = await withLocks(
    payload,
    [
      [1, tutor.id],
      [2, student.id],
    ],
    async (req) => {
      if (kind === "trial" && (await hadTrial(payload, student.id, tutor.id, req))) throw new BookingError("You've already had a trial lesson with this tutor.", 409);
      const tutorBusy = await busyFor(payload, { tutor: { equals: tutor.id } }, start - buffer, end + buffer, req);
      if (tutorBusy.length) throw new BookingError("Sorry, that time was just taken. Please pick another.", 409);
      const mine = await busyFor(payload, { student: { equals: student.id } }, start, end, req);
      if (mine.length) throw new BookingError("You already have a lesson at that time.", 409);
      const now = new Date().toISOString();
      return payload.create({
        collection: "bookings",
        data: {
          reference: `SB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          status: "pending_payment",
          paymentStatus: "unpaid",
          autoConfirm: instant,
          holdUntil: new Date(Date.now() + policies.paymentHoldMinutes * 60_000).toISOString(),
          startsAt: new Date(start).toISOString(),
          endsAt: new Date(end).toISOString(),
          student: student.id,
          tutor: tutor.id,
          tutorUser: idOf(tutor.user)!,
          subject: subjectId,
          kind,
          minutes,
          price: lessonPrice(tutor, policies, kind, minutes),
          currency: policies.currency,
          platformFeePercent: policies.platformFeePercent,
          studentNote: input.note?.trim().slice(0, 1000) || null,
          studentTimezone: safeTz(input.timezone ?? student.timezone),
          history: [{ action: "held for payment", by: student.id, at: now }],
        },
        overrideAccess: true,
        req,
      });
    },
  );

  return booking;
}

/* ------------------------------------------------------------------ actions */

export type BookingAction = "accept" | "decline" | "cancel";

export async function actOnBooking(payload: Payload, user: User, id: number, action: BookingAction, reason?: string) {
  const b = await payload.findByID({ collection: "bookings", id, depth: 0, overrideAccess: true }).catch(() => null);
  const isStudent = b && idOf(b.student) === user.id;
  const isTutor = b && idOf(b.tutorUser) === user.id;
  if (!b || (!isStudent && !isTutor)) throw new BookingError("Booking not found.", 404);
  const now = Date.now();
  const started = Date.parse(b.startsAt) <= now;
  const note = reason?.trim().slice(0, 500) || null;
  let patch: Partial<Booking>;

  if (action === "accept" || action === "decline") {
    if (!isTutor) throw new BookingError("Only the tutor can respond to a request.", 403);
    if (b.status !== "requested") throw new BookingError("This request has already been answered.", 409);
    if (started) throw new BookingError("This request has expired.", 409);
    patch = action === "accept" ? { status: "confirmed", respondedAt: new Date().toISOString() } : { status: "declined", respondedAt: new Date().toISOString(), cancelReason: note, cancelledBy: "tutor" };
  } else if (action === "cancel") {
    if (!HOLDING.includes(b.status as BookingStatus)) throw new BookingError("This lesson can't be cancelled.", 409);
    if (started) throw new BookingError("This lesson has already started.", 409);
    if (b.status === "pending_payment" && !isStudent) throw new BookingError("Booking not found.", 404);
    if (isTutor && b.status === "confirmed" && !note) throw new BookingError("Please tell the student why you're cancelling.");
    const policies = await getPolicies(payload);
    const late = Boolean(isStudent && b.status === "confirmed" && Date.parse(b.startsAt) - now < policies.cancellationRefundHours * 3600_000);
    patch = { status: "cancelled", cancelledBy: isStudent ? "student" : "tutor", cancelReason: note, cancelledAt: new Date().toISOString(), lateCancellation: late };
  } else throw new BookingError("Unknown action.");

  const wasUnpaid = b.status === "pending_payment";
  const updated = await payload.update({
    collection: "bookings",
    id: b.id,
    data: { ...patch, history: [...(b.history ?? []), { action: patch.status === "cancelled" ? `cancelled by ${patch.cancelledBy}` : String(patch.status), by: user.id, at: new Date().toISOString(), note }] } as never,
    overrideAccess: true,
  });

  // Money back: in full when the tutor declines or cancels, or the student cancels in time.
  if (!wasUnpaid && (patch.status === "declined" || patch.status === "cancelled")) {
    const policies = await getPolicies(payload);
    const percent = patch.lateCancellation ? Number(policies.lateCancellationRefundPercent ?? 0) : 100;
    const why = patch.status === "declined" ? "Tutor declined the request" : isTutor ? "Tutor cancelled the lesson" : patch.lateCancellation ? "Late cancellation by the student" : "Cancelled by the student";
    const { refundBooking } = await import("../payments/server");
    await refundBooking(payload, updated.id, percent, why).catch((err) => payload.logger.error({ err }, "[bookings] refund failed"));
  }

  if (wasUnpaid) return updated;
  const ctx = await mailContext(payload, updated);
  if (action === "accept") void send(payload, ctx.student.email, requestAccepted(ctx.lesson, personOf(ctx.student)));
  else if (action === "decline") void send(payload, ctx.student.email, requestDeclined(ctx.lesson, personOf(ctx.student)));
  else if (isStudent) void send(payload, ctx.tutorUser.email, lessonCancelled(ctx.lesson, personOf(ctx.tutorUser), ctx.lesson.studentName, Boolean(updated.lateCancellation)));
  else void send(payload, ctx.student.email, lessonCancelled(ctx.lesson, personOf(ctx.student), ctx.lesson.tutorName));
  return updated;
}

/**
 * Housekeeping, cheap enough to run whenever lists load: unpaid holds release their time, and paid
 * requests nobody answered before the lesson lapse with a full refund.
 */
export async function expireStale(payload: Payload) {
  const nowIso = new Date().toISOString();
  await payload.update({
    collection: "bookings",
    where: { and: [{ status: { equals: "pending_payment" } }, { holdUntil: { less_than_equal: nowIso } }] },
    data: { status: "expired", cancelledBy: "system", cancelledAt: nowIso, cancelReason: "Not paid in time" },
    overrideAccess: true,
    depth: 0,
  });
  const lapsed = await payload.update({
    collection: "bookings",
    where: { and: [{ status: { equals: "requested" } }, { startsAt: { less_than_equal: nowIso } }] },
    data: { status: "expired", cancelledBy: "system", cancelledAt: nowIso, cancelReason: "The tutor didn't reply in time" },
    overrideAccess: true,
    depth: 0,
  });
  if (lapsed.docs.length) {
    const { refundBooking } = await import("../payments/server");
    for (const b of lapsed.docs) await refundBooking(payload, b.id, 100, "Request expired").catch((err) => payload.logger.error({ err }, "[bookings] refund failed"));
  }
}

/* ------------------------------------------------------------------ views */

const mediaUrl = (m: unknown) => (m && typeof m === "object" ? ((m as Media).sizes?.thumb?.url ?? (m as Media).url ?? null) : null);

export type LessonView = {
  id: number;
  reference: string;
  status: BookingStatus;
  phase: "payment" | "requested" | "upcoming" | "finished" | "cancelled";
  holdUntil: string | null;
  refundedAmount: number;
  startsAt: string;
  endsAt: string;
  minutes: number;
  kind: "trial" | "regular";
  subject: string | null;
  price: number;
  currency: string;
  paymentStatus: string;
  note: string | null;
  cancelReason: string | null;
  cancelledBy: string | null;
  lateCancellation: boolean;
  other: { name: string; avatar: string | null; href: string | null };
  canCancel: boolean;
  canRespond: boolean;
  lateIfCancelledNow: boolean;
};

export async function listLessons(payload: Payload, user: User, opts: { from?: Date; to?: Date; limit?: number } = {}): Promise<LessonView[]> {
  await expireStale(payload).catch(() => undefined);
  const role = user.role === "tutor" ? "tutor" : "student";
  const policies = await getPolicies(payload);
  const where: Where = {
    and: [
      role === "tutor" ? { and: [{ tutorUser: { equals: user.id } }, { status: { not_equals: "pending_payment" } }] } : { student: { equals: user.id } },
      ...(opts.from ? [{ endsAt: { greater_than: opts.from.toISOString() } }] : []),
      ...(opts.to ? [{ startsAt: { less_than: opts.to.toISOString() } }] : []),
    ] as Where[],
  };
  const res = await payload.find({ collection: "bookings", where, sort: "startsAt", limit: opts.limit ?? 300, depth: 2, overrideAccess: true }); // filtered to the viewer's own lessons above
  const now = Date.now();
  return res.docs.map((b) => {
    const tutor = b.tutor as TutorProfile;
    const student = b.student as User;
    const holding = HOLDING.includes(b.status as BookingStatus);
    const future = Date.parse(b.startsAt) > now;
    const phase: LessonView["phase"] = b.status === "pending_payment" ? "payment" : !holding && b.status !== "completed" && b.status !== "no_show" ? "cancelled" : b.status === "requested" ? "requested" : Date.parse(b.endsAt) > now && b.status === "confirmed" ? "upcoming" : "finished";
    return {
      id: b.id,
      reference: b.reference ?? "",
      status: b.status as BookingStatus,
      phase,
      startsAt: b.startsAt,
      endsAt: b.endsAt,
      minutes: b.minutes,
      kind: b.kind,
      subject: (b.subject as Subject | null)?.name ?? null,
      price: b.price,
      currency: b.currency,
      paymentStatus: b.paymentStatus ?? "unpaid",
      note: b.studentNote ?? null,
      cancelReason: b.cancelReason ?? null,
      cancelledBy: b.cancelledBy ?? null,
      lateCancellation: Boolean(b.lateCancellation),
      other:
        role === "tutor"
          ? { name: typeof student === "object" ? shortName(student) : "Student", avatar: typeof student === "object" ? mediaUrl(student.avatar) : null, href: null }
          : { name: tutor?.displayName ?? "Tutor", avatar: mediaUrl(tutor?.photo), href: tutor?.slug ? `/tutors/${tutor.slug}` : null },
      holdUntil: b.holdUntil ?? null,
      refundedAmount: b.refundedAmount ?? 0,
      canCancel: holding && future,
      canRespond: role === "tutor" && b.status === "requested" && future,
      lateIfCancelledNow: role === "student" && b.status === "confirmed" && Date.parse(b.startsAt) - now < policies.cancellationRefundHours * 3600_000,
    };
  });
}

export { getPolicies };

import "server-only";
import type { Payload, PayloadRequest } from "payload";
import type { LessonPackage, TutorProfile, User } from "@/payload-types";
import { getPolicies } from "../tutors/server";
import { BookingError, lessonPrice, personOf, send, withLocks } from "../scheduling/server";
import { packageReceipt, refundIssued } from "../email/payments";
import { refundCharge, type ProviderId } from "../payments/providers";

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === "object" ? ((v as { id: number }).id ?? null) : Number(v));
const round2 = (n: number) => Math.round(n * 100) / 100;
type Policies = Awaited<ReturnType<typeof getPolicies>>;

/** Lock key namespace for a package (bookings use 1–4). */
const LOCK = 5;
/** Bookings that use up a lesson from the package. Cancelling in time gives the lesson back. */
const USES = ["pending_payment", "requested", "confirmed", "completed", "no_show"];

export type PackageOffer = { lessons: number; minutes: number; discountPercent: number; price: number; perLesson: number; fullPrice: number; saving: number };

/** What a tutor offers: every package size × every regular lesson length. */
export function packageOffers(tutor: Pick<TutorProfile, "hourlyRate" | "packages">, policies: Policies): PackageOffer[] {
  if (!policies.packagesEnabled || !tutor.hourlyRate) return [];
  const cap = Number(policies.packageMaxDiscountPercent ?? 25);
  const out: PackageOffer[] = [];
  for (const p of tutor.packages ?? []) {
    const lessons = Number(p.lessons);
    const discountPercent = Math.min(cap, Math.max(0, Number(p.discountPercent) || 0));
    if (!lessons || !discountPercent) continue;
    for (const minutes of policies.regularLessonMinutes as number[]) {
      const one = lessonPrice(tutor, policies, "regular", minutes);
      const fullPrice = round2(one * lessons);
      const price = round2(fullPrice * (1 - discountPercent / 100));
      out.push({ lessons, minutes, discountPercent, price, perLesson: round2(price / lessons), fullPrice, saving: round2(fullPrice - price) });
    }
  }
  return out.sort((a, b) => a.minutes - b.minutes || a.lessons - b.lessons);
}

/** Lessons already taken from a package (or held for a booking that's waiting). */
export async function usedLessons(payload: Payload, packageId: number, req?: Partial<PayloadRequest>) {
  const r = await payload.count({
    collection: "bookings",
    where: { and: [{ package: { equals: packageId } }, { or: [{ status: { in: USES } }, { and: [{ status: { equals: "cancelled" } }, { lateCancellation: { equals: true } }] }] }] },
    overrideAccess: true,
    req,
  });
  return r.totalDocs;
}

export type PackageView = {
  id: number;
  reference: string;
  status: LessonPackage["status"];
  tutorId: number | null;
  tutorName: string;
  tutorSlug: string | null;
  lessons: number;
  used: number;
  left: number;
  minutes: number;
  price: number;
  perLesson: number;
  currency: string;
  discountPercent: number;
  expiresAt: string | null;
  paidAt: string | null;
  createdAt: string;
};

async function view(payload: Payload, p: LessonPackage): Promise<PackageView> {
  const used = await usedLessons(payload, p.id);
  const t = typeof p.tutor === "object" ? p.tutor : null;
  return {
    id: p.id,
    reference: p.reference,
    status: p.status,
    tutorId: idOf(p.tutor),
    tutorName: t?.displayName ?? "Your tutor",
    tutorSlug: t?.slug ?? null,
    lessons: p.lessons,
    used,
    left: p.status === "active" ? Math.max(0, p.lessons - used) : 0,
    minutes: p.minutes,
    price: p.price,
    perLesson: p.perLesson,
    currency: p.currency,
    discountPercent: p.discountPercent ?? 0,
    expiresAt: p.expiresAt ?? null,
    paidAt: p.paidAt ?? null,
    createdAt: p.createdAt,
  };
}

/** A student's packages, newest first. Pass a tutor to get only the ones usable with them. */
export async function studentPackages(payload: Payload, student: User, opts: { tutorId?: number; usable?: boolean } = {}) {
  await expirePackages(payload).catch(() => undefined);
  const r = await payload.find({
    collection: "lesson-packages",
    where: {
      and: [
        { student: { equals: student.id } },
        ...(opts.tutorId ? [{ tutor: { equals: opts.tutorId } }] : []),
        ...(opts.usable ? [{ status: { equals: "active" } }] : [{ status: { not_in: ["cancelled"] } }]),
      ],
    },
    sort: "-createdAt",
    limit: 100,
    depth: 1,
    overrideAccess: true,
  });
  const views = await Promise.all(r.docs.map((p) => view(payload, p)));
  return opts.usable ? views.filter((v) => v.left > 0) : views;
}

/** Start buying a package: creates it waiting for payment. Checkout then works like a booking. */
export async function createPackage(payload: Payload, student: User, input: { tutorId: number; lessons: number; minutes: number }) {
  if (student.role !== "student") throw new BookingError("Only student accounts can buy lessons.", 403);
  const policies = await getPolicies(payload);
  if (!policies.packagesEnabled) throw new BookingError("Lesson packages aren't available right now.", 409);
  const tutor = await payload.findByID({ collection: "tutor-profiles", id: input.tutorId, depth: 0, overrideAccess: true }).catch(() => null);
  if (!tutor || tutor.status !== "approved") throw new BookingError("This tutor isn't taking bookings right now.", 404);
  if (idOf(tutor.user) === student.id) throw new BookingError("You can't buy lessons from yourself.");
  const offer = packageOffers(tutor, policies).find((o) => o.lessons === Number(input.lessons) && o.minutes === Number(input.minutes));
  if (!offer) throw new BookingError("This tutor doesn't offer that package any more.", 409);

  // Reuse an unpaid one for the same package instead of piling them up.
  const open = await payload.find({
    collection: "lesson-packages",
    where: { and: [{ student: { equals: student.id } }, { tutor: { equals: tutor.id } }, { status: { equals: "pending_payment" } }, { lessons: { equals: offer.lessons } }, { minutes: { equals: offer.minutes } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  if (open.docs[0]) {
    return payload.update({ collection: "lesson-packages", id: open.docs[0].id, data: { price: offer.price, perLesson: offer.perLesson, discountPercent: offer.discountPercent, currency: policies.currency }, overrideAccess: true });
  }
  return payload.create({
    collection: "lesson-packages",
    data: {
      reference: `PK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      status: "pending_payment",
      student: student.id,
      tutor: tutor.id,
      tutorUser: idOf(tutor.user)!,
      lessons: offer.lessons,
      minutes: offer.minutes,
      discountPercent: offer.discountPercent,
      price: offer.price,
      perLesson: offer.perLesson,
      currency: policies.currency,
      platformFeePercent: policies.platformFeePercent,
      history: [{ action: "created, waiting for payment", by: student.id, at: new Date().toISOString() }],
    },
    overrideAccess: true,
  });
}

/** Payment arrived: switch the package on and send the receipt. Idempotent. */
export async function activatePackage(payload: Payload, packageId: number, payment: { reference: string; amount: number; currency: string; id: number }) {
  const policies = await getPolicies(payload);
  const p = await payload.findByID({ collection: "lesson-packages", id: packageId, depth: 1, overrideAccess: true });
  if (p.status === "active" || p.paidAt) return p;
  const now = new Date();
  const updated = await payload.update({
    collection: "lesson-packages",
    id: p.id,
    data: {
      status: "active",
      paidAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + Number(policies.packageValidityDays ?? 180) * 86400_000).toISOString(),
      history: [...(p.history ?? []), { action: "paid, active", at: now.toISOString() }],
    } as never,
    overrideAccess: true,
  });
  const student = typeof p.student === "object" ? p.student : await payload.findByID({ collection: "users", id: idOf(p.student)!, depth: 0, overrideAccess: true });
  const tutorName = typeof p.tutor === "object" ? (p.tutor.displayName ?? "your tutor") : "your tutor";
  void send(payload, student, packageReceipt(personOf(student), { ...payment, lessons: p.lessons, minutes: p.minutes, tutorName, expiresAt: updated.expiresAt ?? null }));
  return updated;
}

/** Check a package can pay for one more lesson, inside the booking lock. Throws if not. */
export async function claimLesson(payload: Payload, packageId: number, studentId: number, tutorId: number, minutes: number, startsAt: number, req: Partial<PayloadRequest>) {
  const p = await payload.findByID({ collection: "lesson-packages", id: packageId, depth: 0, overrideAccess: true, req }).catch(() => null);
  if (!p || idOf(p.student) !== studentId || idOf(p.tutor) !== tutorId) throw new BookingError("Package not found.", 404);
  if (p.status !== "active") throw new BookingError("This package can't be used any more.", 409);
  if (p.minutes !== minutes) throw new BookingError(`This package is for ${p.minutes}-minute lessons.`, 409);
  if (p.expiresAt && Date.parse(p.expiresAt) < startsAt) throw new BookingError("This package expires before that date. Please pick an earlier time.", 409);
  const used = await usedLessons(payload, p.id, req);
  if (used >= p.lessons) throw new BookingError("You've used all the lessons in this package.", 409);
  return p;
}

/** After a booking from a package changes, mark the package used up (or active again). */
export async function syncPackage(payload: Payload, packageId: number) {
  const p = await payload.findByID({ collection: "lesson-packages", id: packageId, depth: 0, overrideAccess: true }).catch(() => null);
  if (!p || !["active", "used_up"].includes(p.status)) return;
  const used = await usedLessons(payload, p.id);
  const next = used >= p.lessons ? "used_up" : "active";
  if (next !== p.status) await payload.update({ collection: "lesson-packages", id: p.id, data: { status: next }, overrideAccess: true });
}

/** Unpaid packages lapse after a day; active ones expire on their date. */
export async function expirePackages(payload: Payload) {
  const now = new Date();
  await payload.update({
    collection: "lesson-packages",
    where: { and: [{ status: { equals: "pending_payment" } }, { createdAt: { less_than: new Date(now.getTime() - 86400_000).toISOString() } }] },
    data: { status: "cancelled" },
    overrideAccess: true,
    depth: 0,
  });
  await payload.update({
    collection: "lesson-packages",
    where: { and: [{ status: { equals: "active" } }, { expiresAt: { less_than: now.toISOString() } }] },
    data: { status: "expired" },
    overrideAccess: true,
    depth: 0,
  });
}

/**
 * Refund the lessons a student hasn't used (staff action). Lessons already booked stay booked.
 * Returns the amount sent back.
 */
export async function refundUnused(payload: Payload, packageId: number, reason: string, by?: User | null) {
  return withLocks(payload, [[LOCK, packageId]], async () => {
    const p = await payload.findByID({ collection: "lesson-packages", id: packageId, depth: 0, overrideAccess: true });
    if (!["active", "used_up", "expired"].includes(p.status)) throw new BookingError("Only paid packages can be refunded.", 409);
    const used = await usedLessons(payload, p.id);
    const left = Math.max(0, p.lessons - used);
    const due = round2(Math.min(p.price - (p.refundedAmount ?? 0), left * p.perLesson));
    if (due <= 0) throw new BookingError("There are no unused lessons to refund.", 409);
    const pays = await payload.find({ collection: "payments", where: { and: [{ package: { equals: p.id } }, { status: { in: ["succeeded", "partially_refunded"] } }] }, limit: 5, depth: 0, overrideAccess: true });
    let remaining = due;
    let done = 0;
    for (const pay of pays.docs) {
      if (remaining <= 0) break;
      const amount = Math.min(round2(pay.amount - (pay.refundedAmount ?? 0)), remaining);
      if (amount <= 0) continue;
      const providerRef = await refundCharge(pay.provider as ProviderId, pay.chargeRef || pay.providerRef || pay.reference, amount);
      const refunded = round2((pay.refundedAmount ?? 0) + amount);
      await payload.update({
        collection: "payments",
        id: pay.id,
        data: { refundedAmount: refunded, status: refunded >= pay.amount ? "refunded" : "partially_refunded", refunds: [...(pay.refunds ?? []), { amount, reason, providerRef, at: new Date().toISOString() }] },
        overrideAccess: true,
      });
      remaining = round2(remaining - amount);
      done = round2(done + amount);
    }
    if (done <= 0) throw new BookingError("We couldn't find a payment to refund.", 409);
    await payload.update({
      collection: "lesson-packages",
      id: p.id,
      data: {
        status: "refunded",
        refundedAmount: round2((p.refundedAmount ?? 0) + done),
        history: [...(p.history ?? []), { action: `refunded ${left} unused lesson${left === 1 ? "" : "s"}`, by: by?.id ?? null, at: new Date().toISOString(), note: reason }],
      } as never,
      overrideAccess: true,
    });
    const student = await payload.findByID({ collection: "users", id: idOf(p.student)!, depth: 0, overrideAccess: true });
    void send(payload, student, refundIssued(personOf(student), { amount: done, currency: p.currency, bookingRef: p.reference, reason }));
    return done;
  });
}

export { LOCK as PACKAGE_LOCK };

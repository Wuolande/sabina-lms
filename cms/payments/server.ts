import "server-only";
import type { Payload } from "payload";
import type { Booking, Payment, Payout, PayoutMethod, User } from "@/payload-types";
import { HOLDING, type BookingStatus } from "../collections/Bookings";
import { bookedConfirmed, bookingRequested } from "../email/booking";
import { paymentReceipt, payoutRequested, refundIssued } from "../email/payments";
import { siteUrl } from "../email/layout";
import { getPolicies } from "../tutors/server";
import { BookingError, busyFor, mailContext, personOf, send, withLocks } from "../scheduling/server";
import { createCheckout, enabledProviders, refundCharge, verifyCheckout, type ProviderId } from "./providers";

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === "object" ? ((v as { id: number }).id ?? null) : Number(v));
const round2 = (n: number) => Math.round(n * 100) / 100;
const ref = (prefix: string) => `${prefix}-${Date.now().toString(36).slice(-4).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

export { enabledProviders };

/* ------------------------------------------------------------------ checkout */

/**
 * Credit the student can use now: their balance minus credit already set aside for payments
 * still in progress (so the same credit can't pay for two lessons at once).
 */
export async function usableCredit(payload: Payload, studentId: number, currency: string) {
  const policies = await getPolicies(payload);
  if (currency !== policies.currency) return 0;
  const { creditBalance } = await import("../referrals/server");
  const balance = await creditBalance(payload, studentId);
  if (balance <= 0) return 0;
  const pending = await payload.find({ collection: "payments", where: { and: [{ student: { equals: studentId } }, { status: { equals: "pending" } }, { creditUsed: { greater_than: 0 } }, { createdAt: { greater_than: new Date(Date.now() - 3600_000).toISOString() } }] }, limit: 50, depth: 0, select: { creditUsed: true }, overrideAccess: true });
  return Math.max(0, round2(balance - pending.docs.reduce((n, p) => n + (p.creditUsed ?? 0), 0)));
}

/**
 * Create the payment and send the student to checkout. Lesson credit is taken off first; when it
 * covers everything, the payment is settled straight away with no card or M-Pesa needed.
 */
async function charge(
  payload: Payload,
  student: User,
  provider: ProviderId | "credit",
  item: { price: number; currency: string; booking?: number; package?: number; tutor: number | null; description: string; useCredit?: boolean },
) {
  const credit = item.useCredit === false ? 0 : round2(Math.min(await usableCredit(payload, student.id, item.currency), item.price));
  const amount = round2(item.price - credit);
  const viaCredit = amount <= 0;
  if (provider === "credit" && !viaCredit) throw new BookingError("Your lesson credit doesn't cover this. Choose a payment method.", 409);
  if (!viaCredit && !enabledProviders().some((p) => p.id === provider)) throw new BookingError("That payment method isn't available.");
  const reference = ref("PAY");
  const payment = await payload.create({
    collection: "payments",
    data: { reference, status: "pending", provider: viaCredit ? "credit" : provider, amount: viaCredit ? 0 : amount, creditUsed: credit, currency: item.currency, booking: item.booking ?? null, package: item.package ?? null, student: student.id, tutor: item.tutor } as never,
    overrideAccess: true,
  });
  if (viaCredit) {
    await settlePayment(payload, reference, { status: "succeeded", method: "credit" });
    return { url: `/checkout/return?ref=${reference}`, reference };
  }
  try {
    const { url, providerRef } = await createCheckout(provider as ProviderId, {
      reference,
      amount,
      currency: item.currency,
      email: student.email,
      description: item.description,
      successUrl: `${siteUrl()}/checkout/return?ref=${reference}`,
      cancelUrl: `${siteUrl()}/checkout/return?ref=${reference}&cancelled=1`,
    });
    await payload.update({ collection: "payments", id: payment.id, data: { providerRef, checkoutUrl: url }, overrideAccess: true });
    return { url, reference };
  } catch (err) {
    await payload.update({ collection: "payments", id: payment.id, data: { status: "failed", failureReason: (err as Error).message.slice(0, 300) }, overrideAccess: true });
    payload.logger.error({ err }, "[payments] checkout failed");
    throw new BookingError("We couldn't start the payment. Please try again or choose another method.", 502);
  }
}

/** Pay for a lesson package: same providers, no time held. */
export async function startPackageCheckout(payload: Payload, student: User, packageId: number, provider: ProviderId | "credit", opts: { useCredit?: boolean } = {}) {
  const k = await payload.findByID({ collection: "lesson-packages", id: packageId, depth: 1, overrideAccess: true }).catch(() => null);
  if (!k || idOf(k.student) !== student.id) throw new BookingError("Package not found.", 404);
  if (k.status !== "pending_payment") throw new BookingError(k.paidAt ? "This package is already paid." : "This package can no longer be paid. Please choose it again.", 409);
  const tutorName = typeof k.tutor === "object" ? k.tutor.displayName : "your tutor";
  return charge(payload, student, provider, { price: k.price, currency: k.currency, package: k.id, tutor: idOf(k.tutor), description: `${k.lessons} × ${k.minutes}-minute lessons with ${tutorName} (${k.reference})`, useCredit: opts.useCredit });
}

export async function startCheckout(payload: Payload, student: User, bookingId: number, provider: ProviderId | "credit", opts: { useCredit?: boolean } = {}) {
  const b = await payload.findByID({ collection: "bookings", id: bookingId, depth: 1, overrideAccess: true }).catch(() => null);
  if (!b || idOf(b.student) !== student.id) throw new BookingError("Booking not found.", 404);
  if (b.status !== "pending_payment") throw new BookingError(b.paymentStatus === "paid" ? "This lesson is already paid." : "This booking can no longer be paid. Please pick a time again.", 409);
  if (!b.holdUntil || Date.parse(b.holdUntil) <= Date.now()) throw new BookingError("The time we held for you has run out. Please pick a time again.", 409);
  const tutorName = typeof b.tutor === "object" ? b.tutor.displayName : "your tutor";
  return charge(payload, student, provider, { price: b.price, currency: b.currency, booking: b.id, tutor: idOf(b.tutor), description: `${b.kind === "trial" ? "Trial lesson" : `${b.minutes}-minute lesson`} with ${tutorName} (${b.reference})`, useCredit: opts.useCredit });
}

/* ------------------------------------------------------------------ settle */

async function logEvent(payload: Payload, p: Payment, event: unknown) {
  const events = Array.isArray(p.events) ? p.events.slice(-19) : [];
  await payload.update({ collection: "payments", id: p.id, data: { events: [...events, { at: new Date().toISOString(), event }] as never }, overrideAccess: true });
}

/**
 * Record a provider's verdict. Idempotent: webhooks, the return page and retries can all call it.
 * A successful payment confirms the booking (or sends it to the tutor as a request). If the hold ran
 * out and someone else took the time meanwhile, the money goes straight back.
 */
export async function settlePayment(payload: Payload, reference: string, outcome: { status: "succeeded" | "failed" | "pending"; chargeRef?: string; method?: string; event?: unknown }) {
  const found = await payload.find({ collection: "payments", where: { reference: { equals: reference } }, limit: 1, depth: 0, overrideAccess: true });
  const p = found.docs[0];
  if (!p) return null;
  if (outcome.event) await logEvent(payload, p, outcome.event).catch(() => undefined);
  if (outcome.status === "pending" || p.status === "succeeded" || p.status === "refunded" || p.status === "partially_refunded") return p;
  if (outcome.status === "failed") {
    return payload.update({ collection: "payments", id: p.id, data: { status: "failed" }, overrideAccess: true });
  }

  const paid = await payload.update({ collection: "payments", id: p.id, data: { status: "succeeded", paidAt: new Date().toISOString(), chargeRef: outcome.chargeRef || p.chargeRef, method: outcome.method || p.method }, overrideAccess: true });
  if ((p.creditUsed ?? 0) > 0) {
    const { addCredit } = await import("../referrals/server");
    await addCredit(payload, { user: idOf(p.student)!, amount: -(p.creditUsed ?? 0), currency: p.currency, kind: "spent", note: p.package ? "Used for a lesson package" : "Used for a lesson", booking: idOf(p.booking), payment: p.id });
  }
  await (await import("../analytics/store")).track(payload, "payment_succeeded", { userId: idOf(p.student), meta: { paymentId: p.id, amount: p.amount, currency: p.currency, provider: p.provider, package: Boolean(p.package) } });
  if (p.package) {
    const { activatePackage } = await import("../packages/server");
    const k = await payload.findByID({ collection: "lesson-packages", id: idOf(p.package)!, depth: 0, overrideAccess: true });
    if (k.status === "cancelled") {
      // Paid after the unpaid package lapsed: bring it back rather than keep money for nothing.
      await payload.update({ collection: "lesson-packages", id: k.id, data: { status: "pending_payment" }, overrideAccess: true });
    }
    await activatePackage(payload, k.id, { reference: paid.reference, amount: paid.amount, currency: paid.currency, id: paid.id });
    return paid;
  }
  const bookingId = idOf(p.booking)!;
  const result = await withLocks(payload, [[3, bookingId]], async (req) => {
    const b = await payload.findByID({ collection: "bookings", id: bookingId, depth: 0, overrideAccess: true, req });
    if (b.paymentStatus === "paid") return { b, ok: true, already: true };
    const late = b.status !== "pending_payment";
    if (late) {
      // Paid after the hold ran out: keep the lesson only if the time is still free.
      const clash = (await busyFor(payload, { tutor: { equals: idOf(b.tutor) } }, Date.parse(b.startsAt), Date.parse(b.endsAt), req)).filter((x) => x.id !== b.id);
      const mine = (await busyFor(payload, { student: { equals: idOf(b.student) } }, Date.parse(b.startsAt), Date.parse(b.endsAt), req)).filter((x) => x.id !== b.id);
      if (clash.length || mine.length || Date.parse(b.startsAt) <= Date.now() || !["expired", "pending_payment"].includes(b.status)) {
        await payload.update({ collection: "bookings", id: b.id, data: { paymentStatus: "paid" }, overrideAccess: true, req });
        return { b, ok: false, already: false };
      }
    }
    const next = b.autoConfirm ? "confirmed" : "requested";
    const updated = await payload.update({
      collection: "bookings",
      id: b.id,
      data: {
        status: next,
        paymentStatus: "paid",
        holdUntil: null,
        cancelledBy: null,
        cancelledAt: null,
        cancelReason: null,
        respondedAt: next === "confirmed" ? new Date().toISOString() : null,
        history: [...(b.history ?? []), { action: `paid (${p.provider}) → ${next}`, at: new Date().toISOString() }],
      } as never,
      overrideAccess: true,
      req,
    });
    return { b: updated, ok: true, already: false };
  });

  if (result.already) return paid;
  if (!result.ok) {
    await refundBooking(payload, bookingId, 100, "The time was no longer available when the payment arrived");
    return paid;
  }
  const ctx = await mailContext(payload, result.b);
  const mails = result.b.status === "confirmed" ? bookedConfirmed(ctx.lesson, personOf(ctx.student), personOf(ctx.tutorUser)) : bookingRequested(ctx.lesson, personOf(ctx.student), personOf(ctx.tutorUser));
  void send(payload, ctx.student, mails.student);
  void send(payload, ctx.tutorUser, mails.tutor);
  void send(payload, ctx.student, paymentReceipt(personOf(ctx.student), { reference: paid.reference, amount: paid.amount, currency: paid.currency, lesson: ctx.lesson, paymentId: paid.id }));
  return paid;
}

/** The return page asks again in case the webhook hasn't arrived yet. */
export async function refreshPayment(payload: Payload, p: Payment) {
  if (p.status !== "pending" || !p.providerRef || p.provider === "dev") return p;
  const v = await verifyCheckout(p.provider as ProviderId, p.providerRef).catch(() => null);
  if (!v || v.status === "pending") return p;
  return (await settlePayment(payload, p.reference, v)) ?? p;
}

/* ------------------------------------------------------------------ refunds */

/** Refund `percent` of what was paid for a booking (less anything already refunded). */
export async function refundBooking(payload: Payload, bookingId: number, percent: number, reason: string) {
  const b = await payload.findByID({ collection: "bookings", id: bookingId, depth: 0, overrideAccess: true });
  if (b.package) return refundPackageLesson(payload, b, percent, reason);
  const pays = await payload.find({ collection: "payments", where: { and: [{ booking: { equals: bookingId } }, { status: { in: ["succeeded", "partially_refunded"] } }] }, limit: 5, depth: 0, overrideAccess: true });
  if (!pays.docs.length || percent <= 0) return 0;
  const share = Math.min(100, percent) / 100;
  // Money paid by card or M-Pesa goes back there; lesson credit used goes back as credit.
  const paidTotal = pays.docs.reduce((n, p) => n + p.amount, 0);
  const cashBack = pays.docs.reduce((n, p) => n + (p.refundedAmount ?? 0), 0);
  let due = round2(paidTotal * share - cashBack);
  let done = 0;
  for (const p of pays.docs) {
    if (due <= 0) break;
    const room = round2(p.amount - (p.refundedAmount ?? 0));
    const amount = Math.min(room, due);
    if (amount <= 0) continue;
    const providerRef = await refundCharge(p.provider as ProviderId, p.chargeRef || p.providerRef || p.reference, amount);
    const refunded = round2((p.refundedAmount ?? 0) + amount);
    await payload.update({
      collection: "payments",
      id: p.id,
      data: { refundedAmount: refunded, status: refunded >= p.amount ? "refunded" : "partially_refunded", refunds: [...(p.refunds ?? []), { amount, reason, providerRef, at: new Date().toISOString() }] },
      overrideAccess: true,
    });
    due = round2(due - amount);
    done = round2(done + amount);
  }
  const creditUsed = round2(pays.docs.reduce((n, p) => n + (p.creditUsed ?? 0), 0));
  let creditBack = 0;
  if (creditUsed > 0) {
    const returned = await payload.find({ collection: "credits", where: { and: [{ booking: { equals: b.id } }, { kind: { equals: "returned" } }] }, limit: 20, depth: 0, select: { amount: true }, overrideAccess: true });
    creditBack = round2(creditUsed * share - returned.docs.reduce((n, c) => n + (c.amount ?? 0), 0));
    if (creditBack > 0) {
      const { addCredit } = await import("../referrals/server");
      await addCredit(payload, { user: idOf(b.student)!, amount: creditBack, currency: b.currency, kind: "returned", note: `Returned: ${reason}`, booking: b.id });
      if (pays.docs.every((p) => p.amount <= 0)) await payload.update({ collection: "payments", where: { booking: { equals: b.id } }, data: { status: "refunded" }, overrideAccess: true });
    } else creditBack = 0;
  }
  if (done > 0 || creditBack > 0) {
    const total = round2((b.refundedAmount ?? 0) + done + creditBack);
    await payload.update({ collection: "bookings", id: b.id, data: { refundedAmount: total, paymentStatus: total >= b.price - 0.005 ? "refunded" : "partially_refunded" }, overrideAccess: true });
    const student = await payload.findByID({ collection: "users", id: idOf(b.student)!, depth: 0, overrideAccess: true });
    if (done > 0) void send(payload, student, refundIssued(personOf(student), { amount: done, currency: b.currency, bookingRef: b.reference ?? "", reason }));
    if (creditBack > 0) {
      const { notify } = await import("../notify/server");
      await notify(payload, student.id, { kind: "credit_returned", title: `${new Intl.NumberFormat("en", { style: "currency", currency: b.currency }).format(creditBack)} of lesson credit returned`, body: reason, href: "/student/invite" });
    }
  }
  return done;
}

/**
 * A lesson booked from a package. While the package is active the lesson simply goes back into it
 * (a late cancellation uses it up). If the package has ended (refunded or expired) the student gets
 * the lesson's share of the package price back instead.
 */
async function refundPackageLesson(payload: Payload, b: Booking, percent: number, reason: string) {
  const { syncPackage } = await import("../packages/server");
  const packageId = idOf(b.package)!;
  const k = await payload.findByID({ collection: "lesson-packages", id: packageId, depth: 0, overrideAccess: true }).catch(() => null);
  if (!k || percent <= 0) return 0;
  if (k.status === "active" || k.status === "used_up") {
    await payload.update({ collection: "bookings", id: b.id, data: { paymentStatus: "refunded", history: [...(b.history ?? []), { action: "lesson returned to package", at: new Date().toISOString(), note: reason }] } as never, overrideAccess: true });
    await syncPackage(payload, packageId);
    return 0;
  }
  const pays = await payload.find({ collection: "payments", where: { and: [{ package: { equals: packageId } }, { status: { in: ["succeeded", "partially_refunded"] } }] }, limit: 5, depth: 0, overrideAccess: true });
  // Split what's owed between card/M-Pesa and lesson credit in the same ratio the package was paid.
  const paidCash = pays.docs.reduce((n, p) => n + p.amount, 0);
  const paidCredit = pays.docs.reduce((n, p) => n + (p.creditUsed ?? 0), 0);
  const owed = round2((b.price * Math.min(100, percent)) / 100 - (b.refundedAmount ?? 0));
  const whole = paidCash + paidCredit || 1;
  let due = round2((owed * paidCash) / whole);
  const creditBack = owed > 0 ? round2((owed * paidCredit) / whole) : 0;
  let done = 0;
  for (const p of pays.docs) {
    if (due <= 0) break;
    const amount = Math.min(round2(p.amount - (p.refundedAmount ?? 0)), due);
    if (amount <= 0) continue;
    const providerRef = await refundCharge(p.provider as ProviderId, p.chargeRef || p.providerRef || p.reference, amount);
    const refunded = round2((p.refundedAmount ?? 0) + amount);
    await payload.update({ collection: "payments", id: p.id, data: { refundedAmount: refunded, status: refunded >= p.amount ? "refunded" : "partially_refunded", refunds: [...(p.refunds ?? []), { amount, reason, providerRef, at: new Date().toISOString() }] }, overrideAccess: true });
    due = round2(due - amount);
    done = round2(done + amount);
  }
  if (creditBack > 0) {
    const { addCredit } = await import("../referrals/server");
    await addCredit(payload, { user: idOf(b.student)!, amount: creditBack, currency: b.currency, kind: "returned", note: `Returned: ${reason}`, booking: b.id });
  }
  if (done > 0 || creditBack > 0) {
    const total = round2((b.refundedAmount ?? 0) + done + creditBack);
    await payload.update({ collection: "bookings", id: b.id, data: { refundedAmount: total, paymentStatus: total >= b.price - 0.005 ? "refunded" : "partially_refunded" }, overrideAccess: true });
    await payload.update({ collection: "lesson-packages", id: k.id, data: { refundedAmount: round2((k.refundedAmount ?? 0) + done + creditBack) }, overrideAccess: true });
    const student = await payload.findByID({ collection: "users", id: idOf(b.student)!, depth: 0, overrideAccess: true });
    if (done > 0) void send(payload, student, refundIssued(personOf(student), { amount: done, currency: b.currency, bookingRef: b.reference ?? "", reason }));
  }
  return done;
}

/* ------------------------------------------------------------------ earnings */

export type EarningRow = {
  bookingId: number;
  reference: string;
  date: string;
  student: string;
  lesson: string;
  gross: number;
  fee: number;
  net: number;
  state: "upcoming" | "pending" | "available" | "in_payout" | "paid_out";
  availableOn: string | null;
};

const studentName = (u: unknown) => (u && typeof u === "object" ? `${(u as User).firstName ?? ""} ${(u as User).lastName?.charAt(0) ?? ""}.`.trim() : "Student");

/** A tutor's earnings: one row per paid lesson (and per late cancellation they keep money for). */
export async function tutorEarnings(payload: Payload, user: User) {
  await (await import("../scheduling/server")).expireStale(payload).catch(() => undefined);
  const policies = await getPolicies(payload);
  const [bookings, payouts] = await Promise.all([
    payload.find({
      collection: "bookings",
      where: { and: [{ tutorUser: { equals: user.id } }, { paymentStatus: { in: ["paid", "partially_refunded"] } }] },
      sort: "-startsAt",
      limit: 2000,
      depth: 1,
      pagination: false,
      overrideAccess: true,
    }),
    payload.find({ collection: "payouts", where: { tutorUser: { equals: user.id } }, sort: "-createdAt", limit: 200, depth: 0, pagination: false, overrideAccess: true }),
  ]);
  // Bonuses for inviting people are paid out with lesson earnings.
  const bonuses = await payload.find({ collection: "credits", where: { and: [{ user: { equals: user.id } }, { kind: { equals: "tutor_bonus" } }] }, sort: "-createdAt", limit: 500, depth: 1, pagination: false, overrideAccess: true });
  const payoutStatus = new Map(payouts.docs.map((p) => [p.id, p.status]));
  const inPayout = new Map<number, string>();
  for (const p of payouts.docs) if (!["failed", "cancelled"].includes(p.status)) for (const b of p.bookings ?? []) inPayout.set(idOf(b)!, p.status);
  const now = Date.now();
  const holdMs = Number(policies.earningsHoldDays ?? 2) * 86400_000;
  const rows: EarningRow[] = [];
  for (const b of bookings.docs) {
    const kept = b.status === "confirmed" || b.status === "completed" || b.status === "no_show" || b.status === "requested" || (b.status === "cancelled" && b.lateCancellation);
    if (!kept) continue;
    const gross = round2(b.price - (b.refundedAmount ?? 0));
    if (gross <= 0) continue;
    const feePct = b.platformFeePercent ?? policies.platformFeePercent;
    const fee = round2((gross * feePct) / 100);
    const end = b.status === "cancelled" ? Date.parse(b.cancelledAt ?? b.startsAt) : Date.parse(b.endsAt);
    const availableAt = end + holdMs;
    const payoutStatus = inPayout.get(b.id);
    const state: EarningRow["state"] = payoutStatus === "paid" ? "paid_out" : payoutStatus ? "in_payout" : b.status === "requested" || end > now ? "upcoming" : availableAt > now ? "pending" : "available";
    rows.push({
      bookingId: b.id,
      reference: b.reference ?? "",
      date: b.startsAt,
      student: studentName(b.student),
      lesson: b.status === "cancelled" ? "Late cancellation" : b.kind === "trial" ? "Trial lesson" : `${b.minutes}-minute lesson`,
      gross,
      fee,
      net: round2(gross - fee),
      state,
      availableOn: state === "pending" || state === "upcoming" ? new Date(availableAt).toISOString() : null,
    });
  }
  for (const c of bonuses.docs) {
    if ((c.amount ?? 0) <= 0) continue;
    const ps = c.payout ? payoutStatus.get(idOf(c.payout)!) : undefined;
    const live = ps && !["failed", "cancelled"].includes(ps);
    rows.push({
      bookingId: -c.id,
      reference: "",
      date: c.createdAt,
      student: c.friend && typeof c.friend === "object" ? studentName(c.friend) : "A friend",
      lesson: "Invite bonus",
      gross: round2(c.amount),
      fee: 0,
      net: round2(c.amount),
      state: live ? (ps === "paid" ? "paid_out" : "in_payout") : "available",
      availableOn: null,
    });
  }
  rows.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  const sum = (s: EarningRow["state"][]) => round2(rows.filter((r) => s.includes(r.state)).reduce((n, r) => n + r.net, 0));
  const method = (await payload.find({ collection: "payout-methods", where: { user: { equals: user.id } }, limit: 1, depth: 0, overrideAccess: true })).docs[0] ?? null;
  return {
    currency: policies.currency,
    minimumPayout: Number(policies.minimumPayout ?? 0),
    holdDays: Number(policies.earningsHoldDays ?? 2),
    feePercent: policies.platformFeePercent,
    totals: { available: sum(["available"]), pending: sum(["pending"]), upcoming: sum(["upcoming"]), inPayout: sum(["in_payout"]), paidOut: sum(["paid_out"]) },
    rows,
    payouts: payouts.docs.map((p) => ({ id: p.id, reference: p.reference, amount: p.amount, currency: p.currency, status: p.status, method: p.destination?.method ?? null, transferRef: p.transferRef ?? null, notes: p.notes ?? null, createdAt: p.createdAt, paidAt: p.paidAt ?? null })),
    method: method ? methodView(method) : null,
  };
}
export type EarningsView = Awaited<ReturnType<typeof tutorEarnings>>;

export const methodView = (m: PayoutMethod) => ({ method: m.method, mpesaPhone: m.mpesaPhone ?? "", accountName: m.accountName ?? "", bankName: m.bankName ?? "", accountNumber: m.accountNumber ?? "", swift: m.swift ?? "", paypalEmail: m.paypalEmail ?? "" });
export type MethodView = ReturnType<typeof methodView>;

export const summarize = (m: MethodView) =>
  m.method === "mpesa" ? `M-Pesa ${m.mpesaPhone}` : m.method === "paypal" ? `PayPal ${m.paypalEmail}` : `${m.bankName} ••••${m.accountNumber.slice(-4)} (${m.accountName})`;

export async function requestPayout(payload: Payload, user: User): Promise<Payout> {
  return withLocks(payload, [[4, user.id]], async () => {
    const e = await tutorEarnings(payload, user);
    if (!e.method) throw new BookingError("Add your payout details first.");
    const rows = e.rows.filter((r) => r.state === "available");
    const amount = round2(rows.reduce((n, r) => n + r.net, 0));
    if (amount <= 0) throw new BookingError("You have nothing available to withdraw yet.");
    if (amount < e.minimumPayout) throw new BookingError(`The minimum payout is ${e.minimumPayout} ${e.currency}.`);
    const m = e.method;
    const details = m.method === "mpesa" ? `M-Pesa number: ${m.mpesaPhone}` : m.method === "paypal" ? `PayPal: ${m.paypalEmail}` : `Bank: ${m.bankName}\nAccount name: ${m.accountName}\nAccount number: ${m.accountNumber}\nSWIFT/branch: ${m.swift}`;
    const payout = await payload.create({
      collection: "payouts",
      data: { reference: ref("OUT"), status: "requested", amount, currency: e.currency, tutorUser: user.id, destination: { method: m.method, details }, bookings: rows.filter((r) => r.bookingId > 0).map((r) => r.bookingId) },
      overrideAccess: true,
    });
    // Invite bonuses in this payout (rows with negative ids are credits).
    const bonusIds = rows.filter((r) => r.bookingId < 0).map((r) => -r.bookingId);
    if (bonusIds.length) await payload.update({ collection: "credits", where: { id: { in: bonusIds } }, data: { payout: payout.id } as never, overrideAccess: true });
    void send(payload, user, payoutRequested(personOf(user), { amount, currency: e.currency, reference: payout.reference, to: summarize(m) }));
    return payout;
  });
}

/* ------------------------------------------------------------------ student history */

export async function studentPayments(payload: Payload, user: User) {
  const r = await payload.find({ collection: "payments", where: { and: [{ student: { equals: user.id } }, { status: { in: ["succeeded", "refunded", "partially_refunded"] } }] }, sort: "-createdAt", limit: 200, depth: 2, overrideAccess: true });
  return r.docs.map((p) => {
    const b = p.booking as Booking;
    const k = p.package && typeof p.package === "object" ? p.package : null;
    const tutor = b && typeof b.tutor === "object" ? b.tutor.displayName : k && typeof k.tutor === "object" ? k.tutor.displayName : null;
    if (k) return { id: p.id, reference: p.reference, amount: p.amount, refunded: p.refundedAmount ?? 0, currency: p.currency, status: p.status, provider: p.provider, method: p.method ?? null, paidAt: p.paidAt ?? p.createdAt, lesson: `${k.lessons} × ${k.minutes}-minute lessons${tutor ? ` with ${tutor}` : ""}`, startsAt: null, bookingRef: k.reference };
    return { id: p.id, reference: p.reference, amount: p.amount, refunded: p.refundedAmount ?? 0, currency: p.currency, status: p.status, provider: p.provider, method: p.method ?? null, paidAt: p.paidAt ?? p.createdAt, lesson: b ? `${b.kind === "trial" ? "Trial lesson" : `${b.minutes}-minute lesson`}${tutor ? ` with ${tutor}` : ""}` : "Lesson", startsAt: b?.startsAt ?? null, bookingRef: b?.reference ?? "" };
  });
}

export const isHolding = (s: string) => HOLDING.includes(s as BookingStatus);

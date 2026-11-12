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

export async function startCheckout(payload: Payload, student: User, bookingId: number, provider: ProviderId) {
  if (!enabledProviders().some((p) => p.id === provider)) throw new BookingError("That payment method isn't available.");
  const b = await payload.findByID({ collection: "bookings", id: bookingId, depth: 1, overrideAccess: true }).catch(() => null);
  if (!b || idOf(b.student) !== student.id) throw new BookingError("Booking not found.", 404);
  if (b.status !== "pending_payment") throw new BookingError(b.paymentStatus === "paid" ? "This lesson is already paid." : "This booking can no longer be paid. Please pick a time again.", 409);
  if (!b.holdUntil || Date.parse(b.holdUntil) <= Date.now()) throw new BookingError("The time we held for you has run out. Please pick a time again.", 409);
  const tutorName = typeof b.tutor === "object" ? b.tutor.displayName : "your tutor";
  const reference = ref("PAY");
  const payment = await payload.create({
    collection: "payments",
    data: { reference, status: "pending", provider, amount: b.price, currency: b.currency, booking: b.id, student: student.id, tutor: idOf(b.tutor) },
    overrideAccess: true,
  });
  try {
    const { url, providerRef } = await createCheckout(provider, {
      reference,
      amount: b.price,
      currency: b.currency,
      email: student.email,
      description: `${b.kind === "trial" ? "Trial lesson" : `${b.minutes}-minute lesson`} with ${tutorName} (${b.reference})`,
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
  void send(payload, ctx.student.email, mails.student);
  void send(payload, ctx.tutorUser.email, mails.tutor);
  void send(payload, ctx.student.email, paymentReceipt(personOf(ctx.student), { reference: paid.reference, amount: paid.amount, currency: paid.currency, lesson: ctx.lesson, paymentId: paid.id }));
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
  const pays = await payload.find({ collection: "payments", where: { and: [{ booking: { equals: bookingId } }, { status: { in: ["succeeded", "partially_refunded"] } }] }, limit: 5, depth: 0, overrideAccess: true });
  if (!pays.docs.length || percent <= 0) return 0;
  const paidTotal = pays.docs.reduce((n, p) => n + p.amount, 0);
  let due = round2(Math.min(paidTotal, (paidTotal * percent) / 100) - (b.refundedAmount ?? 0));
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
  if (done > 0) {
    const total = round2((b.refundedAmount ?? 0) + done);
    await payload.update({ collection: "bookings", id: b.id, data: { refundedAmount: total, paymentStatus: total >= paidTotal ? "refunded" : "partially_refunded" }, overrideAccess: true });
    const student = await payload.findByID({ collection: "users", id: idOf(b.student)!, depth: 0, overrideAccess: true });
    void send(payload, student.email, refundIssued(personOf(student), { amount: done, currency: b.currency, bookingRef: b.reference ?? "", reason }));
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
      data: { reference: ref("OUT"), status: "requested", amount, currency: e.currency, tutorUser: user.id, destination: { method: m.method, details }, bookings: rows.map((r) => r.bookingId) },
      overrideAccess: true,
    });
    void send(payload, user.email, payoutRequested(personOf(user), { amount, currency: e.currency, reference: payout.reference, to: summarize(m) }));
    return payout;
  });
}

/* ------------------------------------------------------------------ student history */

export async function studentPayments(payload: Payload, user: User) {
  const r = await payload.find({ collection: "payments", where: { and: [{ student: { equals: user.id } }, { status: { in: ["succeeded", "refunded", "partially_refunded"] } }] }, sort: "-createdAt", limit: 200, depth: 2, overrideAccess: true });
  return r.docs.map((p) => {
    const b = p.booking as Booking;
    const tutor = b && typeof b.tutor === "object" ? b.tutor.displayName : null;
    return { id: p.id, reference: p.reference, amount: p.amount, refunded: p.refundedAmount ?? 0, currency: p.currency, status: p.status, provider: p.provider, method: p.method ?? null, paidAt: p.paidAt ?? p.createdAt, lesson: b ? `${b.kind === "trial" ? "Trial lesson" : `${b.minutes}-minute lesson`}${tutor ? ` with ${tutor}` : ""}` : "Lesson", startsAt: b?.startsAt ?? null, bookingRef: b?.reference ?? "" };
  });
}

export const isHolding = (s: string) => HOLDING.includes(s as BookingStatus);

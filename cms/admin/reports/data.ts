import type { Payload } from "payload";
import type { Booking, Payment, Subject, TutorProfile } from "@/payload-types";

export type ReportRange = 30 | 90 | 365;
export const parseReportRange = (v?: string): ReportRange => (v === "30" ? 30 : v === "365" ? 365 : 90);

const r2 = (n: number) => Math.round(n * 100) / 100;
const monthKey = (iso: string) => iso.slice(0, 7);
const PAID = ["succeeded", "partially_refunded", "refunded"];

/**
 * Money and teaching numbers for a period.
 * - Sales: payments received in the period (before refunds); refunds: refunded on those payments.
 * - Sabina fee / tutor earnings: from lessons completed in the period, using each booking's own fee %.
 */
export async function getReport(payload: Payload, range: ReportRange) {
  const since = new Date(Date.now() - range * 86400_000);
  const sinceIso = since.toISOString();

  const [payments, bookings, payouts] = await Promise.all([
    payload.find({ collection: "payments", where: { and: [{ paidAt: { greater_than_equal: sinceIso } }, { status: { in: PAID } }] }, limit: 50000, pagination: false, depth: 0, overrideAccess: true }).then((r) => r.docs as Payment[]),
    payload.find({ collection: "bookings", where: { startsAt: { greater_than_equal: sinceIso, less_than_equal: new Date().toISOString() } }, limit: 50000, pagination: false, depth: 1, overrideAccess: true }).then((r) => r.docs as Booking[]),
    payload.find({ collection: "payouts", where: { createdAt: { greater_than_equal: sinceIso } }, limit: 10000, pagination: false, depth: 0, overrideAccess: true }).then((r) => r.docs),
  ]);
  const currency = payments[0]?.currency ?? bookings[0]?.currency ?? "USD";

  const sales = r2(payments.reduce((n, p) => n + p.amount, 0));
  const refunds = r2(payments.reduce((n, p) => n + (p.refundedAmount ?? 0), 0));
  const completed = bookings.filter((b) => b.status === "completed");
  const fee = (b: Booking) => (b.price * (b.platformFeePercent ?? 0)) / 100;
  const sabinaFee = r2(completed.reduce((n, b) => n + fee(b), 0));
  const tutorEarnings = r2(completed.reduce((n, b) => n + b.price - fee(b), 0));
  const ended = bookings.filter((b) => ["completed", "no_show", "cancelled", "declined", "expired"].includes(b.status));
  const cancelled = ended.filter((b) => b.status === "cancelled").length;
  const noShows = bookings.filter((b) => b.status === "no_show").length;

  // By month, newest first.
  const months = new Map<string, { month: string; lessons: number; sales: number; refunds: number; fee: number; tutors: number }>();
  const row = (k: string) => months.get(k) ?? months.set(k, { month: k, lessons: 0, sales: 0, refunds: 0, fee: 0, tutors: 0 }).get(k)!;
  for (const p of payments) {
    const m = row(monthKey(p.paidAt ?? p.createdAt));
    m.sales += p.amount;
    m.refunds += p.refundedAmount ?? 0;
  }
  for (const b of completed) {
    const m = row(monthKey(b.startsAt));
    m.lessons += 1;
    m.fee += fee(b);
    m.tutors += b.price - fee(b);
  }
  const monthly = [...months.values()].sort((a, b) => b.month.localeCompare(a.month)).map((m) => ({ ...m, sales: r2(m.sales), refunds: r2(m.refunds), fee: r2(m.fee), tutors: r2(m.tutors) }));

  // Top tutors and subjects by completed lessons.
  const tutors = new Map<number, { id: number; name: string; slug: string | null; lessons: number; earned: number; rating: number }>();
  const subjects = new Map<string, number>();
  for (const b of completed) {
    const t = b.tutor as TutorProfile;
    if (t && typeof t === "object") {
      const e = tutors.get(t.id) ?? { id: t.id, name: t.displayName ?? "Tutor", slug: t.slug ?? null, lessons: 0, earned: 0, rating: t.stats?.rating ?? 0 };
      e.lessons += 1;
      e.earned += b.price - fee(b);
      tutors.set(t.id, e);
    }
    const s = (b.subject as Subject | null)?.name ?? "Other";
    subjects.set(s, (subjects.get(s) ?? 0) + 1);
  }
  const statusCounts = ["completed", "confirmed", "no_show", "cancelled", "declined", "expired"].map((s) => ({ status: s, count: bookings.filter((b) => b.status === s).length }));

  return {
    range,
    currency,
    totals: {
      sales,
      refunds,
      net: r2(sales - refunds),
      sabinaFee,
      tutorEarnings,
      lessons: completed.length,
      noShows,
      cancelRate: ended.length ? Math.round((cancelled / ended.length) * 100) : 0,
      paidOut: r2(payouts.filter((p) => p.status === "paid").reduce((n, p) => n + p.amount, 0)),
    },
    monthly,
    topTutors: [...tutors.values()].sort((a, b) => b.lessons - a.lessons || b.earned - a.earned).slice(0, 8).map((t) => ({ ...t, earned: r2(t.earned) })),
    topSubjects: [...subjects.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8),
    statusCounts,
  };
}

/** Things staff should act on, for the dashboard. */
export async function attention(payload: Payload) {
  const count = (collection: string, where: object) => payload.count({ collection: collection as never, where: where as never, overrideAccess: true }).then((r) => r.totalDocs).catch(() => 0);
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const [applications, problems, flagged, payouts, requests, failedEmails] = await Promise.all([
    count("tutor-profiles", { status: { equals: "submitted" } }),
    count("bookings", { and: [{ "issue.reportedAt": { exists: true } }, { "issue.resolved": { not_equals: true } }] }),
    count("conversations", { flagged: { equals: true } }),
    count("payouts", { status: { in: ["requested", "processing"] } }),
    count("bookings", { status: { equals: "requested" } }),
    count("email-log", { and: [{ status: { equals: "failed" } }, { createdAt: { greater_than_equal: weekAgo } }] }),
  ]);
  return [
    { label: "Tutor applications to review", count: applications, href: "/admin/collections/tutor-profiles?where[or][0][and][0][status][equals]=submitted" },
    { label: "Reported lesson problems", count: problems, href: "/admin/collections/bookings?where[or][0][and][0][issue.reportedAt][exists]=true&where[or][0][and][1][issue.resolved][not_equals]=true" },
    { label: "Conversations flagged for review", count: flagged, href: "/admin/collections/conversations?where[or][0][and][0][flagged][equals]=true" },
    { label: "Payouts to send", count: payouts, href: "/admin/collections/payouts?where[or][0][and][0][status][in]=requested,processing" },
    { label: "Lesson requests waiting on tutors", count: requests, href: "/admin/collections/bookings?where[or][0][and][0][status][equals]=requested" },
    { label: "Emails that failed this week", count: failedEmails, href: "/admin/collections/email-log?where[or][0][and][0][status][equals]=failed" },
  ];
}

import type { Payload } from "payload";

export type Bucket = { key: string; label: string; students: number; tutors: number; staff: number };
export type Range = 7 | 30 | 90;

export const parseRange = (v?: string): Range => (v === "7" ? 7 : v === "90" ? 90 : 30);

const DAY = 86_400_000;
const STAFF = new Set(["admin", "manager", "finance", "support", "editor"]);

const pct = (now: number, before: number) => (before ? Math.round(((now - before) / before) * 100) : now ? 100 : 0);

/**
 * Dashboard numbers. Phase 0 only has accounts; bookings, lessons and revenue join this as each
 * collection lands (the cards for them already render and show "coming soon" until then).
 */
export async function getDashboardData(payload: Payload, range: Range) {
  const since = new Date(Date.now() - range * DAY);
  const prevSince = new Date(Date.now() - 2 * range * DAY);
  const has = (slug: string) => payload.config.collections.some((c) => c.slug === slug);

  const count = (where: Record<string, unknown>) =>
    payload.count({ collection: "users", where: where as never, overrideAccess: true }).then((r) => r.totalDocs).catch(() => 0);

  const [students, tutors, staff, recent, prevCount, latest] = await Promise.all([
    count({ role: { equals: "student" } }),
    count({ role: { equals: "tutor" } }),
    count({ role: { in: [...STAFF] } }),
    payload
      .find({ collection: "users", where: { createdAt: { greater_than_equal: since.toISOString() } }, limit: 5000, depth: 0, pagination: false, select: { role: true, createdAt: true }, overrideAccess: true })
      .then((r) => r.docs as { role?: string; createdAt: string }[])
      .catch(() => []),
    count({ and: [{ createdAt: { greater_than_equal: prevSince.toISOString() } }, { createdAt: { less_than: since.toISOString() } }] }),
    payload
      .find({ collection: "users", sort: "-createdAt", limit: 6, depth: 0, overrideAccess: true })
      .then((r) => r.docs as { id: number | string; name?: string; email: string; role?: string; status?: string; createdAt: string }[])
      .catch(() => []),
  ]);

  // Daily buckets for 7/30 days, weekly for 90.
  const step = range === 90 ? 7 : 1;
  const n = Math.ceil(range / step);
  const start = new Date(Date.now() - (n * step - 1) * DAY);
  start.setHours(0, 0, 0, 0);
  const buckets: Bucket[] = Array.from({ length: n }, (_, i) => {
    const d = new Date(start.getTime() + i * step * DAY);
    return { key: d.toISOString(), label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), students: 0, tutors: 0, staff: 0 };
  });
  for (const u of recent) {
    const i = Math.min(n - 1, Math.max(0, Math.floor((new Date(u.createdAt).getTime() - start.getTime()) / (step * DAY))));
    const b = buckets[i];
    if (u.role === "student") b.students++;
    else if (u.role === "tutor") b.tutors++;
    else if (STAFF.has(u.role ?? "")) b.staff++;
  }

  const bookingCount = (where: Record<string, unknown>) =>
    has("bookings") ? payload.count({ collection: "bookings", where: where as never, overrideAccess: true }).then((r) => r.totalDocs).catch(() => 0) : Promise.resolve(0);
  const [booked, upcoming, requests] = await Promise.all([
    bookingCount({ and: [{ createdAt: { greater_than_equal: since.toISOString() } }, { status: { in: ["requested", "confirmed", "completed"] } }] }),
    bookingCount({ and: [{ startsAt: { greater_than: new Date().toISOString() } }, { status: { equals: "confirmed" } }] }),
    bookingCount({ status: { equals: "requested" } }),
  ]);

  return {
    lessons: { booked, upcoming, requests },
    totals: { students, tutors, staff, all: students + tutors + staff },
    signups: { count: recent.length, delta: pct(recent.length, prevCount), spark: buckets.map((b) => b.students + b.tutors + b.staff) },
    studentSpark: buckets.map((b) => b.students),
    tutorSpark: buckets.map((b) => b.tutors),
    buckets,
    latest,
    modules: {
      bookings: has("bookings"),
      payments: has("payments"),
      applications: has("tutor-applications"),
    },
  };
}

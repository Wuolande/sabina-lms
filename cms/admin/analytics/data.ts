import type { Payload } from "payload";
import { sql } from "@payloadcms/db-postgres";

export const ANALYTICS_RANGES = [7, 30, 90, 365] as const;
export const parseRange = (v: unknown) => (ANALYTICS_RANGES as readonly number[]).includes(Number(v)) ? Number(v) : 30;

type Row = Record<string, unknown>;
const num = (v: unknown) => Number(v ?? 0) || 0;
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);
const change = (now: number, before: number) => (before > 0 ? Math.round(((now - before) / before) * 100) : null);

async function rows(payload: Payload, q: ReturnType<typeof sql>): Promise<Row[]> {
  const r = (await payload.db.drizzle.execute(q)) as unknown as { rows?: Row[] } | Row[];
  return Array.isArray(r) ? r : (r.rows ?? []);
}

/** Everything the Analytics page shows, for the last `days` days (compared with the period before). */
export async function getAnalytics(payload: Payload, days: number) {
  const since = new Date(Date.now() - days * 86400_000);
  const before = new Date(Date.now() - 2 * days * 86400_000);
  const bucket = days > 90 ? "week" : "day";

  const [totals, prev, bounce, trend, pages, entries, sources, channels, countries, devices, browsers, systems, live, actions, signupSources] = await Promise.all([
    rows(payload, sql`select count(*) filter (where type = 'pageview') as views, count(distinct visitor) filter (where type = 'pageview') as visitors, count(distinct session) filter (where type = 'pageview') as sessions from analytics.events where at >= ${since}`),
    rows(payload, sql`select count(*) filter (where type = 'pageview') as views, count(distinct visitor) filter (where type = 'pageview') as visitors, count(distinct session) filter (where type = 'pageview') as sessions from analytics.events where at >= ${before} and at < ${since}`),
    rows(payload, sql`select count(*) as single from (select session from analytics.events where type = 'pageview' and at >= ${since} and session is not null group by session having count(*) = 1) s`),
    rows(payload, sql`select date_trunc(${bucket}, at) as d, count(distinct visitor) as visitors, count(*) as views from analytics.events where type = 'pageview' and at >= ${since} group by 1 order by 1`),
    rows(payload, sql`select path as label, count(*) as views, count(distinct visitor) as visitors from analytics.events where type = 'pageview' and at >= ${since} group by path order by views desc limit 15`),
    rows(payload, sql`select path as label, count(*) as value from analytics.events where type = 'pageview' and at >= ${since} and meta->>'entry' = 'true' group by path order by value desc limit 10`),
    rows(payload, sql`select coalesce(source, 'Direct') as label, count(*) as value from analytics.events where type = 'pageview' and at >= ${since} and meta->>'entry' = 'true' group by 1 order by value desc limit 12`),
    rows(payload, sql`select coalesce(channel, 'direct') as label, count(*) as value from analytics.events where type = 'pageview' and at >= ${since} and meta->>'entry' = 'true' group by 1 order by value desc`),
    rows(payload, sql`select coalesce(country, '??') as label, count(distinct visitor) as value from analytics.events where type = 'pageview' and at >= ${since} group by 1 order by value desc limit 12`),
    rows(payload, sql`select coalesce(device, 'desktop') as label, count(distinct visitor) as value from analytics.events where type = 'pageview' and at >= ${since} group by 1 order by value desc`),
    rows(payload, sql`select coalesce(browser, 'Other') as label, count(distinct visitor) as value from analytics.events where type = 'pageview' and at >= ${since} group by 1 order by value desc limit 8`),
    rows(payload, sql`select coalesce(os, 'Other') as label, count(distinct visitor) as value from analytics.events where type = 'pageview' and at >= ${since} group by 1 order by value desc limit 8`),
    rows(payload, sql`select count(distinct visitor) as n from analytics.events where type = 'pageview' and at >= now() - interval '5 minutes'`),
    rows(payload, sql`select type as label, count(*) as value from analytics.events where type <> 'pageview' and at >= ${since} group by type`),
    rows(payload, sql`
      with s as (select user_id, visitor from analytics.events where type = 'signup' and at >= ${since}),
      first_touch as (
        select distinct on (e.visitor) e.visitor, coalesce(e.source, 'Direct') as src
        from analytics.events e join s on s.visitor = e.visitor
        where e.type = 'pageview' and e.meta->>'entry' = 'true'
        order by e.visitor, e.at
      )
      select coalesce(f.src, 'Unknown') as label, count(*) as value from s left join first_touch f on f.visitor = s.visitor group by 1 order by value desc limit 10`),
  ]);

  const t = totals[0] ?? {};
  const p = prev[0] ?? {};
  const sessions = num(t.sessions);
  const list = (r: Row[]) => r.map((x) => ({ label: String(x.label), value: num(x.value) }));
  const actionCount = Object.fromEntries(actions.map((a) => [String(a.label), num(a.value)]));
  return {
    days,
    bucket,
    live: num(live[0]?.n),
    totals: {
      visitors: num(t.visitors),
      sessions,
      views: num(t.views),
      bounceRate: pct(num(bounce[0]?.single), sessions),
      viewsPerSession: sessions ? Math.round((num(t.views) / sessions) * 10) / 10 : 0,
    },
    change: { visitors: change(num(t.visitors), num(p.visitors)), sessions: change(sessions, num(p.sessions)), views: change(num(t.views), num(p.views)) },
    trend: trend.map((r) => ({ date: new Date(String(r.d)).toISOString(), visitors: num(r.visitors), views: num(r.views) })),
    pages: pages.map((r) => ({ path: String(r.label), views: num(r.views), visitors: num(r.visitors) })),
    entries: list(entries),
    sources: list(sources),
    channels: list(channels),
    countries: list(countries),
    devices: list(devices),
    browsers: list(browsers),
    systems: list(systems),
    actions: actionCount,
    signupSources: list(signupSources),
    funnel: await getFunnel(payload, since),
  };
}
export type AnalyticsData = Awaited<ReturnType<typeof getAnalytics>>;

/**
 * Where people drop off. Students who signed up in the period are followed to their first
 * booking, first payment, first finished lesson and a second paid lesson, whenever those happened.
 * Tutors are followed from sign-up to application, approval and first lesson taught.
 */
export async function getFunnel(payload: Payload, since: Date) {
  const [visitors, students, tutors] = await Promise.all([
    rows(payload, sql`select count(distinct visitor) as n from analytics.events where type = 'pageview' and at >= ${since}`),
    rows(payload, sql`
      with c as (select id from payload.users where role = 'student' and created_at >= ${since}),
      b as (
        select c.id,
          count(k.id) as booked,
          count(k.id) filter (where k.payment_status in ('paid', 'partially_refunded') or k.package_id is not null) as paid,
          count(k.id) filter (where k.status = 'completed') as completed
        from c left join payload.bookings k on k.student_id = c.id
        group by c.id
      )
      select count(*) as signed_up,
        count(*) filter (where booked > 0) as booked,
        count(*) filter (where paid > 0) as paid,
        count(*) filter (where completed > 0) as completed,
        count(*) filter (where paid > 1) as repeat
      from b`),
    rows(payload, sql`
      select count(*) as signed_up,
        count(*) filter (where t.status in ('submitted', 'approved', 'changes_requested', 'rejected', 'suspended')) as applied,
        count(*) filter (where t.status = 'approved') as approved,
        count(*) filter (where coalesce(t.stats_lessons_taught, 0) > 0) as teaching
      from payload.users u left join payload.tutor_profiles t on t.user_id = u.id
      where u.role = 'tutor' and u.created_at >= ${since}`),
  ]);
  const s = students[0] ?? {};
  const tu = tutors[0] ?? {};
  const v = num(visitors[0]?.n);
  const steps = (list: [string, number, string][]) =>
    list.map(([label, value, hint], i) => ({ label, value, hint, ofFirst: pct(value, list[0]![1]), ofPrevious: i ? pct(value, list[i - 1]![1]) : 100 }));
  // Before analytics has a full period of history there can be fewer recorded visitors than sign-ups.
  const partialVisitors = v < num(s.signed_up);
  return {
    partialVisitors,
    students: steps([
      ...(partialVisitors ? [] : ([["Visitors", v, "People who visited the site"]] as [string, number, string][])),
      ["Signed up", num(s.signed_up), "Created a student account"],
      ["Booked a lesson", num(s.booked), "Picked a tutor and a time"],
      ["Paid", num(s.paid), "Paid for a lesson or package"],
      ["Had a lesson", num(s.completed), "Finished their first lesson"],
      ["Booked again", num(s.repeat), "Paid for a second lesson"],
    ]),
    tutors: steps([
      ["Signed up", num(tu.signed_up), "Created a tutor account"],
      ["Applied", num(tu.applied), "Sent their application"],
      ["Approved", num(tu.approved), "Profile is live"],
      ["Teaching", num(tu.teaching), "Taught at least one lesson"],
    ]),
  };
}

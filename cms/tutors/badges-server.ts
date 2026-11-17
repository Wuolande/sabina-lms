import "server-only";
import type { Payload } from "payload";
import { sql } from "@payloadcms/db-postgres";
import { getPolicies } from "./server";
import { sortBadges, type BadgeValue } from "./badges";

type Row = Record<string, unknown>;
const num = (v: unknown) => Number(v ?? 0) || 0;
const KEY = "sabina:badges-at";
const EVERY_MS = 3 * 3600_000;

async function rows(payload: Payload, q: ReturnType<typeof sql>): Promise<Row[]> {
  const r = (await payload.db.drizzle.execute(q)) as unknown as { rows?: Row[] } | Row[];
  return Array.isArray(r) ? r : (r.rows ?? []);
}

/**
 * Work out every approved tutor's badges from their reviews, replies and lessons, and save the
 * ones that changed. Runs with the scheduled jobs at most every 3 hours (or straight away with
 * `force`). Also stores each tutor's typical reply time, shown on their profile.
 */
export async function refreshBadges(payload: Payload, force = false) {
  if (!force) {
    const at = await payload.kv.get<number>(KEY).catch(() => null);
    if (at && Date.now() - at < EVERY_MS) return null;
  }
  await payload.kv.set(KEY, Date.now()).catch(() => undefined);
  const p = await getPolicies(payload);
  const [tutors, demand, replies] = await Promise.all([
    rows(payload, sql`select id, user_id, approved_at, stats_rating, stats_review_count, stats_lessons_taught, stats_response_minutes from payload.tutor_profiles where status = 'approved'`),
    rows(payload, sql`select tutor_id, count(*) as n from payload.bookings where created_at >= now() - interval '30 days' and status in ('requested', 'confirmed', 'completed') group by tutor_id`),
    // For each conversation, a "wait" is the run of student messages since the tutor last wrote;
    // it ends at the tutor's next message. The typical (median) wait over 60 days is the reply time.
    rows(payload, sql`
      with m as (
        select msg.conversation_id as c, msg.created_at as at, (msg.sender_id = conv.tutor_user_id) as by_tutor, conv.tutor_id
        from payload.messages msg join payload.conversations conv on conv.id = msg.conversation_id
        where msg.created_at >= now() - interval '60 days' and coalesce(msg.hidden, false) = false
      ),
      g as (
        select *, coalesce(sum(case when by_tutor then 1 else 0 end) over (partition by c order by at rows between unbounded preceding and 1 preceding), 0) as grp from m
      ),
      w as (
        select tutor_id, min(at) filter (where not by_tutor) as asked, min(at) filter (where by_tutor) as replied from g group by c, tutor_id, grp
      )
      select tutor_id, count(*) as n, percentile_cont(0.5) within group (order by extract(epoch from replied - asked) / 60) as minutes
      from w where asked is not null and replied is not null group by tutor_id`),
  ]);
  const demandOf = new Map(demand.map((r) => [num(r.tutor_id), num(r.n)]));
  const replyOf = new Map(replies.map((r) => [num(r.tutor_id), { n: num(r.n), minutes: Math.round(num(r.minutes)) }]));
  let changed = 0;
  for (const t of tutors) {
    const id = num(t.id);
    const lessons = num(t.stats_lessons_taught);
    const reply = replyOf.get(id);
    const earned: BadgeValue[] = [];
    if (num(t.stats_review_count) >= Number(p.badgeTopRatedReviews) && num(t.stats_rating) >= Number(p.badgeTopRatedRating)) earned.push("top_rated");
    if (reply && reply.n >= 3 && reply.minutes <= Number(p.badgeFastReplyHours) * 60) earned.push("fast_responder");
    if ((demandOf.get(id) ?? 0) >= Number(p.badgeInDemandLessons)) earned.push("in_demand");
    const milestone = lessons >= 500 ? "lessons_500" : lessons >= 100 ? "lessons_100" : lessons >= 50 ? "lessons_50" : lessons >= 10 ? "lessons_10" : null;
    if (milestone) earned.push(milestone);
    if (t.approved_at && Date.now() - Date.parse(String(t.approved_at)) < Number(p.badgeNewTutorDays) * 86400_000) earned.push("new_tutor");
    const next = sortBadges(earned);
    const doc = await payload.findByID({ collection: "tutor-profiles", id, depth: 0, overrideAccess: true }).catch(() => null);
    if (!doc) continue;
    const before = sortBadges((doc.badges as string[] | null) ?? []);
    const minutes = reply && reply.n >= 3 ? reply.minutes : null;
    if (before.join() === next.join() && (doc.stats?.responseMinutes ?? null) === minutes) continue;
    await payload.update({ collection: "tutor-profiles", id, data: { badges: next, stats: { ...(doc.stats ?? {}), responseMinutes: minutes } } as never, overrideAccess: true, context: { skipTutorChecks: true } });
    changed++;
  }
  return { tutors: tutors.length, changed };
}

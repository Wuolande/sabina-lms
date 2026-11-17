import "server-only";
import type { User } from "@/payload-types";
import type { HomeData } from "@/components/portal/PortalHome";
import { safeTz } from "@/lib/time";
import { getPayloadClient } from "../auth/session";
import { listLessons } from "./server";

/** Numbers and next lessons for the student and tutor home pages. */
export async function homeData(user: User): Promise<HomeData> {
  const payload = await getPayloadClient();
  const lessons = await listLessons(payload, user);
  let earned: number | null = null;
  if (user.role === "tutor") {
    const { tutorEarnings } = await import("../payments/server");
    const e = await tutorEarnings(payload, user);
    const month = new Date().toISOString().slice(0, 7);
    earned = Math.round(e.rows.filter((r) => r.date.slice(0, 7) === month).reduce((n, r) => n + r.net, 0) * 100) / 100;
  }
  const live = lessons.filter((l) => l.phase === "upcoming" || l.phase === "requested" || l.phase === "payment");
  const done = lessons.filter((l) => l.phase === "finished");
  const people = new Set(lessons.filter((l) => l.phase !== "cancelled").map((l) => l.other.name)).size;
  let hasHours = false;
  if (user.role === "tutor") {
    const s = await payload.find({ collection: "schedules", where: { user: { equals: user.id } }, limit: 1, depth: 0, overrideAccess: true });
    hasHours = Boolean(s.docs[0]?.weekly?.length);
  }
  let rating: HomeData["rating"];
  let badges: HomeData["badges"];
  if (user.role === "tutor") {
    const t = (await payload.find({ collection: "tutor-profiles", where: { user: { equals: user.id } }, limit: 1, depth: 0, overrideAccess: true })).docs[0];
    if (t) {
      const [{ BADGES }, { getPolicies }] = await Promise.all([import("../tutors/badges"), import("../tutors/server")]);
      const p = (await getPolicies(payload)) as unknown as import("../tutors/badges").Thresholds;
      const have = new Set((t.badges as string[] | null) ?? []);
      const milestone = BADGES.filter((b) => b.value.startsWith("lessons_")).find((b) => have.has(b.value));
      rating = { value: t.stats?.rating ?? 0, count: t.stats?.reviewCount ?? 0 };
      // One lesson milestone at a time: the one they have, or the next to reach.
      const next = milestone ?? BADGES.filter((b) => b.value.startsWith("lessons_")).reverse().find((b) => Number(b.value.split("_")[1]) > (t.stats?.lessonsTaught ?? 0));
      badges = BADGES.filter((b) => !b.value.startsWith("lessons_") || b.value === next?.value)
        .filter((b) => b.value !== "new_tutor" || have.has("new_tutor"))
        .map((b) => ({ value: b.value, label: b.label, hint: b.hint(p), earned: have.has(b.value) }));
    }
  }
  let reviewsGiven = 0;
  let toRate: HomeData["toRate"] = [];
  if (user.role === "student") {
    const { unratedLessons } = await import("../lessons/server");
    [reviewsGiven, toRate] = await Promise.all([payload.count({ collection: "reviews", where: { student: { equals: user.id } }, overrideAccess: true }).then((r) => r.totalDocs), unratedLessons(payload, user)]);
  }
  return {
    tz: safeTz(user.timezone),
    reviewsGiven,
    toRate,
    rating,
    badges,
    upcoming: live.slice(0, 4),
    upcomingCount: live.filter((l) => l.phase === "upcoming").length,
    hours: done.reduce((n, l) => n + l.minutes, 0) / 60,
    people,
    requests: lessons.filter((l) => l.phase === "requested").length,
    hasHours,
    booked: lessons.some((l) => l.phase !== "cancelled" && l.phase !== "payment"),
    earned,
    currency: lessons[0]?.currency ?? "USD",
  };
}

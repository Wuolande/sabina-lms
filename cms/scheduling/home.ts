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
  return {
    tz: safeTz(user.timezone),
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

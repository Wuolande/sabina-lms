import { NextResponse, type NextRequest } from "next/server";
import { APIError } from "payload";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { ownSchedule } from "@/cms/scheduling/server";
import { validTimeZone } from "@/lib/time";
import type { Schedule, User } from "@/payload-types";
import { isKnownZone } from "@/cms/geo/server";

const view = (s: Schedule) => ({
  timezone: s.timezone,
  weekly: (s.weekly ?? []).map((w) => ({ day: Number(w.day), start: w.start, end: w.end })),
  timeOff: (s.timeOff ?? []).map((t) => ({ from: t.from, to: t.to, note: t.note ?? "" })),
  noticeHours: s.noticeHours ?? 12,
  bufferMinutes: s.bufferMinutes ?? 0,
  instantBooking: s.instantBooking ?? true,
});
export type ScheduleView = ReturnType<typeof view>;

async function tutor(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  return { payload, user: user?.role === "tutor" ? user : null };
}

export async function GET(req: NextRequest) {
  const { payload, user } = await tutor(req);
  if (!user) return fail("Tutors only.", 403);
  return NextResponse.json({ schedule: view(await ownSchedule(payload, user)) });
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** PUT the whole schedule: { timezone, weekly[], timeOff[], noticeHours, bufferMinutes, instantBooking }. */
export async function PUT(req: NextRequest) {
  const { payload, user } = await tutor(req);
  if (!user) return fail("Tutors only.", 403);
  const b = (await req.json().catch(() => ({}))) as Partial<ScheduleView>;
  if (!validTimeZone(b.timezone) || !(await isKnownZone(payload, b.timezone))) return fail("Choose a time zone from the list.");
  const weekly = (Array.isArray(b.weekly) ? b.weekly : []).slice(0, 70);
  if (weekly.some((w) => !(Number(w.day) >= 0 && Number(w.day) <= 6) || !HHMM.test(w.start) || !HHMM.test(w.end))) return fail("Check your weekly hours.");
  const timeOff = (Array.isArray(b.timeOff) ? b.timeOff : []).slice(0, 60);
  if (timeOff.some((t) => !DAY.test(t.from) || !DAY.test(t.to))) return fail("Check your time off dates.");
  const clamp = (n: unknown, lo: number, hi: number, d: number) => (Number.isFinite(Number(n)) ? Math.min(hi, Math.max(lo, Math.round(Number(n)))) : d);
  const current = await ownSchedule(payload, user);
  try {
    const saved = await payload.update({
      collection: "schedules",
      id: current.id,
      data: {
        timezone: b.timezone,
        weekly: weekly.map((w) => ({ day: String(w.day) as "0", start: w.start, end: w.end })),
        timeOff: timeOff.map((t) => ({ from: t.from, to: t.to, note: String(t.note ?? "").slice(0, 120) })),
        noticeHours: clamp(b.noticeHours, 0, 168, 12),
        bufferMinutes: clamp(b.bufferMinutes, 0, 60, 0),
        instantBooking: b.instantBooking !== false,
      },
      user,
      overrideAccess: false,
    });
    return NextResponse.json({ success: true, schedule: view(saved) });
  } catch (err) {
    if (err instanceof APIError) return fail(err.message, 400);
    payload.logger.error({ err }, "[schedule] save failed");
    return fail("We couldn't save your schedule.", 500);
  }
}

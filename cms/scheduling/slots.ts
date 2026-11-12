import { addDays, dateKey, toMinutes, weekdayOfKey, zonedToUtc } from "../../lib/time";

export type WeeklyRange = { day: string | number; start: string; end: string };
export type TimeOff = { from: string; to: string };
export type Busy = { start: number; end: number };

const STEP = 30; // slots start on the hour and half hour

/**
 * Open start times (UTC ms) for a lesson of `minutes`, from the tutor's weekly hours in their own
 * zone, minus time off, existing bookings (plus the tutor's break), and the notice period.
 */
export function computeSlots(opts: {
  timezone: string;
  weekly: WeeklyRange[];
  timeOff?: TimeOff[];
  busy: Busy[];
  minutes: number;
  noticeHours: number;
  bufferMinutes?: number;
  windowDays: number;
  now?: number;
}): number[] {
  const { timezone: tz, weekly, minutes } = opts;
  const now = opts.now ?? Date.now();
  const earliest = now + opts.noticeHours * 3600_000;
  const latest = now + opts.windowDays * 86400_000;
  const buffer = (opts.bufferMinutes ?? 0) * 60_000;
  const len = minutes * 60_000;
  const off = (opts.timeOff ?? []).filter((t) => t.from && t.to);
  const busy = [...opts.busy].sort((a, b) => a.start - b.start);

  // Ranges per weekday, merged so back-to-back ranges allow lessons across the join.
  const days = new Map<number, [number, number][]>();
  for (const w of weekly) {
    const d = Number(w.day);
    const s = toMinutes(w.start);
    const e = toMinutes(w.end);
    if (!(e > s)) continue;
    days.set(d, [...(days.get(d) ?? []), [s, e]]);
  }
  for (const [d, r] of days) {
    r.sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];
    for (const x of r) {
      const last = merged[merged.length - 1];
      if (last && x[0] <= last[1]) last[1] = Math.max(last[1], x[1]);
      else merged.push([...x]);
    }
    days.set(d, merged);
  }

  const out: number[] = [];
  let key = dateKey(now, tz);
  const lastKey = dateKey(latest, tz);
  for (let guard = 0; key <= lastKey && guard < 400; guard++, key = addDays(key, 1)) {
    if (off.some((t) => key >= t.from && key <= t.to)) continue;
    const ranges = days.get(weekdayOfKey(key));
    if (!ranges) continue;
    const [y, m, d] = key.split("-").map(Number);
    for (const [s, e] of ranges) {
      for (let t = Math.ceil(s / STEP) * STEP; t + minutes <= e; t += STEP) {
        const start = zonedToUtc(y, m, d, Math.floor(t / 60), t % 60, tz);
        // Daylight-saving jumps can shift a wall time; drop starts that no longer fit the range.
        if (dateKey(start, tz) !== key) continue;
        const end = start + len;
        if (start < earliest || start > latest) continue;
        if (busy.some((b) => start < b.end + buffer && end + buffer > b.start)) continue;
        out.push(start);
      }
    }
  }
  return [...new Set(out)].sort((a, b) => a - b);
}

/** True when [start, end) sits inside the tutor's weekly hours on that local day and not on time off. */
export function withinHours(opts: { timezone: string; weekly: WeeklyRange[]; timeOff?: TimeOff[]; start: number; minutes: number }) {
  const slots = computeSlots({ timezone: opts.timezone, weekly: opts.weekly, timeOff: opts.timeOff, busy: [], minutes: opts.minutes, noticeHours: 0, windowDays: 1, now: opts.start - 1 });
  return slots.includes(opts.start);
}

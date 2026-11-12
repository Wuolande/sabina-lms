/**
 * Time-zone helpers built on Intl only (no date library). Shared by the server (slot calculation)
 * and the browser (showing lessons in the viewer's zone).
 */
export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function validTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || !tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
export const safeTz = (tz: unknown, fallback = "UTC") => (validTimeZone(tz) ? tz : fallback);

const partsCache = new Map<string, Intl.DateTimeFormat>();
function partsFmt(tz: string) {
  let f = partsCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "short" });
    partsCache.set(tz, f);
  }
  return f;
}

/** Wall-clock parts of an instant in a zone. `weekday` is 0 (Sunday) – 6. */
export function zonedParts(date: Date | number, tz: string) {
  const p = Object.fromEntries(partsFmt(tz).formatToParts(date).map((x) => [x.type, x.value]));
  return {
    year: +p.year,
    month: +p.month,
    day: +p.day,
    hour: +p.hour % 24,
    minute: +p.minute,
    second: +p.second,
    weekday: DAYS_SHORT.indexOf(p.weekday as (typeof DAYS_SHORT)[number]),
  };
}

/** Offset of `tz` from UTC at an instant, in minutes (Nairobi → 180). */
export function tzOffsetMinutes(at: number, tz: string) {
  const p = zonedParts(at, tz);
  return Math.round((Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(at / 1000) * 1000) / 60000);
}

/** The UTC instant of a wall-clock time in `tz`. Times that don't exist (DST gap) move forward. */
export function zonedToUtc(year: number, month: number, day: number, hour: number, minute: number, tz: string) {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  let t = guess - tzOffsetMinutes(guess, tz) * 60000;
  const second = guess - tzOffsetMinutes(t, tz) * 60000;
  if (second !== t) t = second;
  return t;
}

/** "YYYY-MM-DD" of an instant in a zone. */
export function dateKey(at: Date | number, tz: string) {
  const p = zonedParts(at, tz);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Add whole days to a "YYYY-MM-DD" key (calendar arithmetic, zone-free). */
export function addDays(key: string, n: number) {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}
export const weekdayOfKey = (key: string) => new Date(`${key}T12:00:00Z`).getUTCDay();

/** "09:30" → 570 */
export const toMinutes = (hhmm: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  return m ? +m[1] * 60 + +m[2] : NaN;
};
export const fromMinutes = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

export function fmtTime(at: Date | number | string, tz: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date(at));
}
export function fmtDay(at: Date | number | string, tz: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" }) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, ...opts }).format(new Date(at));
}
export function fmtRange(start: string | Date, end: string | Date, tz: string) {
  return `${fmtTime(start, tz)} – ${fmtTime(end, tz)}`;
}
/** "GMT+3" style label for a zone. */
export function tzLabel(tz: string, at: number = Date.now()) {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(at).find((p) => p.type === "timeZoneName")?.value;
  return `${tz.replace(/_/g, " ")}${name ? ` (${name})` : ""}`;
}

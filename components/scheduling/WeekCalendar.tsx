"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LessonView } from "@/cms/scheduling/server";
import { addDays, dateKey, DAYS_SHORT, fmtDay, fmtRange, fmtTime, toMinutes, tzLabel, weekdayOfKey, zonedToUtc } from "@/lib/time";

type Availability = { timezone: string; weekly: { day: number; start: string; end: string }[]; timeOff: { from: string; to: string }[] };
const HOUR = 52;

const startOf = (key: string, tz: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return zonedToUtc(y!, m!, d!, 0, 0, tz);
};
const mondayOf = (key: string) => addDays(key, -((weekdayOfKey(key) + 6) % 7));

/** Availability ranges (UTC ms) from weekly hours in the tutor's zone, for the schedule days around a week. */
function openRanges(a: Availability, fromKey: string, days: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = -1; i <= days; i++) {
    const k = addDays(fromKey, i);
    if (a.timeOff.some((t) => k >= t.from && k <= t.to)) continue;
    const [y, m, d] = k.split("-").map(Number);
    for (const w of a.weekly.filter((x) => Number(x.day) === weekdayOfKey(k))) {
      const s = toMinutes(w.start);
      const e = toMinutes(w.end);
      out.push([zonedToUtc(y!, m!, d!, Math.floor(s / 60), s % 60, a.timezone), zonedToUtc(y!, m!, d!, Math.floor(e / 60), e % 60, a.timezone)]);
    }
  }
  return out;
}

const tone = (l: LessonView) =>
  l.phase === "requested" || l.phase === "payment" ? "bg-amber-50 text-amber-900 ring-amber-300 border-dashed" : l.phase === "finished" ? "bg-slate-100 text-slate-600 ring-slate-200" : "bg-brand-600 text-white ring-brand-700";

/** Week view of lessons (and, for tutors, open hours) in the viewer's time zone. Phones get a day agenda. */
export function WeekCalendar({ lessons, tz, role, availability }: { lessons: LessonView[]; tz: string; role: "student" | "tutor"; availability?: Availability | null }) {
  const today = dateKey(Date.now(), tz);
  const [week, setWeek] = useState(mondayOf(today));
  const [day, setDay] = useState(today);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  const keys = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(week, i)), [week]);
  const visible = useMemo(() => lessons.filter((l) => l.phase !== "cancelled"), [lessons]);
  const listHref = role === "tutor" ? "/tutor/lessons" : "/student/lessons";

  const cols = useMemo(() => {
    const open = availability ? openRanges(availability, week, 7) : [];
    return keys.map((k) => {
      const s = startOf(k, tz);
      const e = startOf(addDays(k, 1), tz);
      const items = visible.filter((l) => Date.parse(l.startsAt) >= s && Date.parse(l.startsAt) < e);
      const blocks = open.filter(([a, b]) => a < e && b > s).map(([a, b]) => [Math.max(a, s), Math.min(b, e)] as [number, number]);
      return { key: k, start: s, items, open: blocks };
    });
  }, [keys, tz, visible, availability, week]);

  // Show 7:00–21:00 by default, widened to fit anything outside it.
  const [fromH, toH] = useMemo(() => {
    let lo = 7,
      hi = 21;
    for (const c of cols) {
      for (const l of c.items) {
        lo = Math.min(lo, Math.floor((Date.parse(l.startsAt) - c.start) / 3600_000));
        hi = Math.max(hi, Math.ceil((Date.parse(l.endsAt) - c.start) / 3600_000));
      }
      for (const [a, b] of c.open) {
        lo = Math.min(lo, Math.floor((a - c.start) / 3600_000));
        hi = Math.max(hi, Math.ceil((b - c.start) / 3600_000));
      }
    }
    return [Math.max(0, lo), Math.min(24, hi)];
  }, [cols]);
  const y = (t: number, colStart: number) => ((t - colStart) / 3600_000 - fromH) * HOUR;

  const shift = (n: number) => {
    const w = addDays(week, n * 7);
    setWeek(w);
    setDay(n === 0 ? today : w);
  };
  const dayCol = cols.find((c) => c.key === day);
  const agenda = useMemo(() => {
    if (dayCol) return dayCol.items;
    const s = startOf(day, tz);
    const e = startOf(addDays(day, 1), tz);
    return visible.filter((l) => Date.parse(l.startsAt) >= s && Date.parse(l.startsAt) < e);
  }, [dayCol, day, tz, visible]);

  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200/70">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:px-5">
        <div>
          <h2 className="font-heading text-lg font-bold text-slate-900">
            {fmtDay(startOf(keys[0]!, tz) + 3600_000, tz, { month: "long", day: "numeric" })} – {fmtDay(startOf(keys[6]!, tz) + 3600_000, tz, { month: "long", day: "numeric", year: "numeric" })}
          </h2>
          <p className="text-xs text-slate-500">Times in {tzLabel(tz)}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => shift(-1)} aria-label="Previous week" className="grid h-10 w-10 place-items-center rounded-xl ring-1 ring-slate-200 hover:bg-slate-50">
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => shift(0)} className="h-10 rounded-xl px-3.5 text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-50">
            Today
          </button>
          <button type="button" onClick={() => shift(1)} aria-label="Next week" className="grid h-10 w-10 place-items-center rounded-xl ring-1 ring-slate-200 hover:bg-slate-50">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Phones: day strip + agenda */}
      <div className="md:hidden">
        <div className="grid grid-cols-7 gap-1 p-3">
          {cols.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setDay(c.key)}
              className={`flex flex-col items-center rounded-xl py-2 text-xs ${day === c.key ? "bg-brand-700 text-white" : c.key === today ? "bg-brand-50 text-brand-800" : "text-slate-600"}`}
            >
              <span>{DAYS_SHORT[weekdayOfKey(c.key)]}</span>
              <span className="text-base font-bold">{Number(c.key.slice(8))}</span>
              <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${c.items.length ? (day === c.key ? "bg-white" : "bg-brand-500") : "bg-transparent"}`} />
            </button>
          ))}
        </div>
        <div className="space-y-2 px-3 pb-4">
          {agenda.length ? (
            agenda.map((l) => (
              <Link key={l.id} href={`/${role}/lessons/${l.id}`} className={`block rounded-2xl p-3 ring-1 ${tone(l)}`}>
                <p className="text-sm font-semibold">{fmtRange(l.startsAt, l.endsAt, tz)}</p>
                <p className="text-sm opacity-90">
                  {l.kind === "trial" ? "Trial" : (l.subject ?? "Lesson")} · {l.other.name}
                  {l.phase === "requested" ? " · request" : ""}
                </p>
              </Link>
            ))
          ) : (
            <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-500">No lessons on {fmtDay(startOf(day, tz) + 3600_000, tz)}.</p>
          )}
        </div>
      </div>

      {/* Tablets and up: week grid */}
      <div className="hidden overflow-x-auto md:block">
        <div className="grid min-w-[720px] grid-cols-[68px_repeat(7,minmax(0,1fr))]">
          <div />
          {cols.map((c) => (
            <div key={c.key} className={`border-l border-slate-100 px-2 py-2.5 text-center ${c.key === today ? "text-brand-700" : "text-slate-600"}`}>
              <p className="text-xs font-semibold uppercase tracking-wide">{DAYS_SHORT[weekdayOfKey(c.key)]}</p>
              <p className={`mx-auto mt-0.5 grid h-8 w-8 place-items-center rounded-full text-base font-bold ${c.key === today ? "bg-brand-700 text-white" : ""}`}>{Number(c.key.slice(8))}</p>
            </div>
          ))}
          <div className="relative" style={{ height: (toH - fromH) * HOUR }}>
            {Array.from({ length: toH - fromH }, (_, i) => (
              <span key={i} className="absolute right-2 -translate-y-1/2 whitespace-nowrap text-[11px] text-slate-400" style={{ top: i * HOUR }}>
                {i === 0 ? "" : fmtTime(Date.UTC(2020, 0, 1, fromH + i), "UTC")}
              </span>
            ))}
          </div>
          {cols.map((c) => (
            <div key={c.key} className="relative border-l border-t border-slate-100" style={{ height: (toH - fromH) * HOUR }}>
              {Array.from({ length: toH - fromH }, (_, i) => (
                <div key={i} className="absolute inset-x-0 border-t border-slate-100" style={{ top: i * HOUR }} />
              ))}
              {c.open.map(([a, b], i) => (
                <div key={i} className="absolute inset-x-0 bg-emerald-50/80" style={{ top: y(a, c.start), height: ((b - a) / 3600_000) * HOUR }} title="Open for booking" />
              ))}
              {now && c.key === today && now >= c.start && <div className="absolute inset-x-0 z-10 border-t-2 border-rose-500" style={{ top: y(now, c.start) }} />}
              {c.items.map((l) => {
                const s = Date.parse(l.startsAt);
                const h = Math.max(22, ((Date.parse(l.endsAt) - s) / 3600_000) * HOUR - 3);
                return (
                  <Link
                    key={l.id}
                    href={`/${role}/lessons/${l.id}`}
                    title={`${fmtRange(l.startsAt, l.endsAt, tz)} · ${l.other.name}`}
                    className={`absolute inset-x-1 z-20 overflow-hidden rounded-lg px-2 py-1 text-xs ring-1 transition hover:brightness-95 ${tone(l)}`}
                    style={{ top: y(s, c.start) + 1, height: h }}
                  >
                    <p className="truncate font-semibold">{fmtTime(l.startsAt, tz)}</p>
                    {h > 34 && <p className="truncate opacity-90">{l.other.name}</p>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-4 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-brand-600" /> Confirmed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-dashed border-amber-400 bg-amber-50" /> Request
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-slate-200" /> Finished
        </span>
        {availability && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-emerald-100" /> Open hours
          </span>
        )}
      </div>
    </div>
  );
}

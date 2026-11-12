"use client";
import { useMemo, useState } from "react";
import { CalendarOff, Check, Copy, Loader2, Plus, Trash2 } from "lucide-react";
import type { ScheduleView } from "@/app/api/tutor/schedule/route";
import { Card, Select, Toggle, controlCls } from "@/components/portal/form";
import { useZones } from "@/components/portal/AccountSettings";
import { DAYS, fromMinutes, toMinutes } from "@/lib/time";

type Range = { day: number; start: string; end: string };
const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first
const TIMES = Array.from({ length: 49 }, (_, i) => fromMinutes(i * 30)); // 00:00 … 24:00
const label12 = (hhmm: string) => {
  if (hhmm === "24:00") return "Midnight";
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h! + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h! < 12 ? "am" : "pm"}`;
};

function TimeSelect({ value, onChange, min, max, label }: { value: string; onChange: (v: string) => void; min?: string; max?: string; label: string }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={`${controlCls} h-11 w-[7.5rem] px-3 text-sm`}>
      {TIMES.filter((t) => (!min || t > min) && (!max || t < max)).map((t) => (
        <option key={t} value={t}>
          {label12(t)}
        </option>
      ))}
    </select>
  );
}

/** Weekly hours, booking rules and time off for a tutor. Saves the whole schedule in one request. */
export function AvailabilityEditor({ initial, todayKey }: { initial: ScheduleView; todayKey: string }) {
  const zones = useZones();
  const [s, setS] = useState<ScheduleView>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = JSON.stringify(s) !== saved;

  const byDay = useMemo(() => {
    const m = new Map<number, (Range & { i: number })[]>();
    s.weekly.forEach((w, i) => m.set(w.day, [...(m.get(w.day) ?? []), { ...w, i }]));
    for (const v of m.values()) v.sort((a, b) => a.start.localeCompare(b.start));
    return m;
  }, [s.weekly]);
  const hours = s.weekly.reduce((n, w) => n + Math.max(0, toMinutes(w.end) - toMinutes(w.start)), 0) / 60;

  const setWeekly = (weekly: Range[]) => setS((x) => ({ ...x, weekly }));
  const patch = (i: number, p: Partial<Range>) => setWeekly(s.weekly.map((w, j) => (j === i ? { ...w, ...p } : w)));
  const addRange = (day: number) => {
    const last = byDay.get(day)?.at(-1);
    const start = last ? Math.min(toMinutes(last.end) + 60, 23 * 60) : 9 * 60;
    const end = Math.min(start + (last ? 120 : 8 * 60), 24 * 60);
    setWeekly([...s.weekly, { day, start: fromMinutes(start), end: fromMinutes(end) }]);
  };
  const copyToWeekdays = (day: number) => {
    const src = (byDay.get(day) ?? []).map(({ start, end }) => ({ start, end }));
    setWeekly([...s.weekly.filter((w) => w.day === day || ![1, 2, 3, 4, 5].includes(w.day)), ...[1, 2, 3, 4, 5].filter((d) => d !== day).flatMap((d) => src.map((r) => ({ day: d, ...r })))]);
  };
  const preset = (kind: "weekdays" | "evenings" | "clear") => {
    if (kind === "clear") return setWeekly([]);
    const r = kind === "weekdays" ? { start: "09:00", end: "17:00" } : { start: "17:00", end: "21:00" };
    setWeekly([...s.weekly.filter((w) => ![1, 2, 3, 4, 5].includes(w.day)), ...[1, 2, 3, 4, 5].map((day) => ({ day, ...r }))]);
  };

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/tutor/schedule", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { schedule?: ScheduleView; error?: string };
    setBusy(false);
    if (!res?.ok || !data.schedule) return setMsg({ ok: false, text: data.error || "We couldn't save. Please try again." });
    setS(data.schedule);
    setSaved(JSON.stringify(data.schedule));
    setMsg({ ok: true, text: "Saved. Students now see your new hours." });
  }

  return (
    <div className="space-y-6 pb-24">
      <Card>
        <h2 className="font-heading text-lg font-bold text-slate-900">Booking rules</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Select label="Your time zone" value={s.timezone} onChange={(e) => setS({ ...s, timezone: e.target.value })} hint="Your weekly hours are in this zone. Students see them in theirs.">
            {!zones.some((z) => z.z === s.timezone) && <option value={s.timezone}>{s.timezone.replace(/_/g, " ")}</option>}
            {zones.map((z) => (
              <option key={z.z} value={z.z}>
                {z.label}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Minimum notice" value={String(s.noticeHours)} onChange={(e) => setS({ ...s, noticeHours: Number(e.target.value) })}>
              {[0, 1, 2, 4, 6, 12, 24, 48, 72].map((h) => (
                <option key={h} value={h}>
                  {h === 0 ? "None" : h < 24 ? `${h} hour${h > 1 ? "s" : ""}` : `${h / 24} day${h > 24 ? "s" : ""}`}
                </option>
              ))}
            </Select>
            <Select label="Break between lessons" value={String(s.bufferMinutes)} onChange={(e) => setS({ ...s, bufferMinutes: Number(e.target.value) })}>
              {[0, 5, 10, 15, 30].map((m) => (
                <option key={m} value={m}>
                  {m === 0 ? "None" : `${m} minutes`}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <Toggle label="Instant booking" sub={s.instantBooking ? "Students book open times straight away." : "Students send a request; you accept or decline it."} checked={s.instantBooking} onChange={(v) => setS({ ...s, instantBooking: v })} />
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900">Weekly hours</h2>
            <p className="mt-1 text-sm text-slate-500">{hours ? `${hours % 1 ? hours.toFixed(1) : hours} hours a week open for booking.` : "You're not open for bookings yet. Add the hours you can teach."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => preset("weekdays")} className="h-9 rounded-lg bg-slate-100 px-3 text-sm font-medium text-slate-700 hover:bg-slate-200">
              Weekdays 9–5
            </button>
            <button type="button" onClick={() => preset("evenings")} className="h-9 rounded-lg bg-slate-100 px-3 text-sm font-medium text-slate-700 hover:bg-slate-200">
              Weekday evenings
            </button>
            <button type="button" onClick={() => preset("clear")} className="h-9 rounded-lg px-3 text-sm font-medium text-slate-500 hover:bg-slate-100">
              Clear all
            </button>
          </div>
        </div>
        <ul className="mt-5 divide-y divide-slate-100">
          {ORDER.map((day) => {
            const ranges = byDay.get(day) ?? [];
            return (
              <li key={day} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
                <label className="flex w-40 shrink-0 cursor-pointer items-center gap-3 pt-2.5">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
                    checked={ranges.length > 0}
                    onChange={(e) => (e.target.checked ? addRange(day) : setWeekly(s.weekly.filter((w) => w.day !== day)))}
                  />
                  <span className="font-semibold text-slate-900">{DAYS[day]}</span>
                </label>
                <div className="min-w-0 flex-1 space-y-2">
                  {ranges.length === 0 && <p className="pt-2.5 text-sm text-slate-400">Unavailable</p>}
                  {ranges.map((r) => (
                    <div key={r.i} className="flex flex-wrap items-center gap-2">
                      <TimeSelect label={`${DAYS[day]} start`} value={r.start} max="24:00" onChange={(v) => patch(r.i, { start: v, end: toMinutes(r.end) <= toMinutes(v) ? fromMinutes(Math.min(toMinutes(v) + 60, 1440)) : r.end })} />
                      <span className="text-slate-400">–</span>
                      <TimeSelect label={`${DAYS[day]} end`} value={r.end} min={r.start} onChange={(v) => patch(r.i, { end: v })} />
                      <button type="button" onClick={() => setWeekly(s.weekly.filter((_, j) => j !== r.i))} aria-label={`Remove ${DAYS[day]} ${label12(r.start)}`} className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1 sm:pt-1">
                  <button type="button" onClick={() => addRange(day)} aria-label={`Add hours on ${DAYS[day]}`} title="Add hours" className="grid h-10 w-10 place-items-center rounded-lg text-brand-700 hover:bg-brand-50">
                    <Plus size={18} />
                  </button>
                  {ranges.length > 0 && day >= 1 && day <= 5 && (
                    <button type="button" onClick={() => copyToWeekdays(day)} title="Copy to all weekdays" aria-label={`Copy ${DAYS[day]} to all weekdays`} className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
                      <Copy size={17} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900">Time off</h2>
            <p className="mt-1 text-sm text-slate-500">Holidays and days you can&apos;t teach. Existing lessons stay booked.</p>
          </div>
          <button type="button" onClick={() => setS({ ...s, timeOff: [...s.timeOff, { from: todayKey, to: todayKey, note: "" }] })} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-brand-700 ring-1 ring-slate-200 hover:bg-brand-50">
            <Plus size={16} /> Add time off
          </button>
        </div>
        {s.timeOff.length ? (
          <ul className="mt-4 space-y-3">
            {s.timeOff.map((t, i) => (
              <li key={i} className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[10rem_10rem_minmax(0,1fr)_auto] sm:items-center">
                <input type="date" aria-label="From" value={t.from} min={todayKey} onChange={(e) => setS({ ...s, timeOff: s.timeOff.map((x, j) => (j === i ? { ...x, from: e.target.value, to: x.to < e.target.value ? e.target.value : x.to } : x)) })} className={`${controlCls} h-11 px-3 text-sm`} />
                <input type="date" aria-label="To" value={t.to} min={t.from} onChange={(e) => setS({ ...s, timeOff: s.timeOff.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)) })} className={`${controlCls} h-11 px-3 text-sm`} />
                <input type="text" aria-label="Note" placeholder="Note (only you see it)" value={t.note} maxLength={120} onChange={(e) => setS({ ...s, timeOff: s.timeOff.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)) })} className={`${controlCls} col-span-2 h-11 px-3 text-sm sm:col-span-1`} />
                <button type="button" onClick={() => setS({ ...s, timeOff: s.timeOff.filter((_, j) => j !== i) })} aria-label="Remove time off" className="col-span-2 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm text-slate-500 hover:bg-rose-50 hover:text-rose-600 sm:col-span-1 sm:w-10">
                  <Trash2 size={17} /> <span className="sm:hidden">Remove</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            <CalendarOff size={18} /> No time off planned.
          </p>
        )}
      </Card>

      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 px-4 lg:bottom-6 lg:left-auto lg:right-8 lg:px-0">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-2xl lg:mx-0">
          <p className={`text-sm ${msg && !msg.ok ? "text-rose-300" : "text-slate-300"}`} role="status">
            {msg && (!msg.ok || !dirty) ? msg.text : dirty ? "You have unsaved changes." : "All changes saved."}
          </p>
          <button type="button" onClick={save} disabled={busy || !dirty} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-accent-400 px-4 text-sm font-semibold text-brand-950 hover:bg-accent-300 disabled:opacity-50">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

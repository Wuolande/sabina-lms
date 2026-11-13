"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck, CalendarDays, CheckCircle2, Clock, Hourglass, Loader2, Package, Sparkles, Zap } from "lucide-react";
import type { PackageOffer } from "@/cms/packages/server";
import type { LessonOption } from "@/cms/scheduling/server";
import { Combobox } from "@/components/ui/Combobox";
import { useGeo, withCurrent } from "@/components/ui/useGeo";
import { PayStep, type Provider } from "@/components/payments/PayStep";
import { controlCls } from "@/components/portal/form";
import { addDays, dateKey, DAYS_SHORT, fmtDay, fmtRange, fmtTime, tzLabel, weekdayOfKey, zonedParts } from "@/lib/time";
import { money } from "@/lib/money";

type OwnPackage = { id: number; minutes: number; left: number; expiresAt: string | null };
type SlotsResponse = { minutes: number; options: LessonOption[]; slots: string[]; tutorTimezone: string; hasHours: boolean; instant: boolean; currency: string; windowDays: number; offers: PackageOffer[]; packages: OwnPackage[] };
type Tutor = { id: number; slug: string; name: string; photo: string | null; subjects: { id: number; name: string }[]; primarySubjectId: number | null };

const PERIODS = [
  { key: "Morning", from: 0, to: 12 },
  { key: "Afternoon", from: 12, to: 17 },
  { key: "Evening", from: 17, to: 24 },
];

/** Pick a lesson type, a day and a time in the student's own zone, then confirm. */
export function BookingWidget({ tutor, initialTz, initialKind, cancellationHours }: { tutor: Tutor; initialTz: string; initialKind?: "trial" | "regular"; cancellationHours: number }) {
  const { zoneOptions } = useGeo();
  const [tz, setTz] = useState(initialTz);
  const [data, setData] = useState<SlotsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [choice, setChoice] = useState<{ kind: "trial" | "regular"; minutes: number } | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<number | null>(tutor.primarySubjectId ?? tutor.subjects[0]?.id ?? null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  type Held = { id: number; status: string; reference: string; startsAt: string; endsAt: string; holdUntil: string | null; price: number; currency: string; paidFromPackage?: boolean };
  const [usePackage, setUsePackage] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [done, setDone] = useState<{ booking: Held; providers: Provider[] } | null>(null);

  const load = useCallback(
    async (minutes?: number) => {
      setLoading(true);
      const res = await fetch(`/api/tutors/${tutor.slug}/slots${minutes ? `?minutes=${minutes}` : ""}`, { credentials: "include", cache: "no-store" }).catch(() => null);
      const d = (await res?.json().catch(() => null)) as SlotsResponse | null;
      setLoading(false);
      if (!res?.ok || !d) return setError("We couldn't load this tutor's calendar. Please refresh.");
      setData(d);
      setChoice((c) => {
        if (c && d.options.some((o) => o.kind === c.kind && o.minutes === c.minutes)) return c;
        const pick = d.options.find((o) => o.kind === (initialKind ?? "trial")) ?? d.options.find((o) => o.minutes === 60) ?? d.options[0];
        return pick ? { kind: pick.kind, minutes: pick.minutes } : null;
      });
    },
    [tutor.slug, initialKind],
  );
  useEffect(() => {
    void load();
  }, [load]);
  // Reload when the length changes (slot starts depend on it).
  useEffect(() => {
    if (choice && data && choice.minutes !== data.minutes) void load(choice.minutes);
  }, [choice, data, load]);

  const slotsByDay = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const s of data?.slots ?? []) {
      const k = dateKey(Date.parse(s), tz);
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return m;
  }, [data, tz]);
  const today = dateKey(Date.now(), tz);
  const days = useMemo(() => Array.from({ length: (data?.windowDays ?? 42) + 1 }, (_, i) => addDays(today, i)), [today, data?.windowDays]);

  useEffect(() => {
    if (!data) return;
    if (!day || !slotsByDay.has(day)) setDay([...slotsByDay.keys()].sort()[0] ?? null);
    if (slot && !data.slots.includes(slot)) setSlot(null);
  }, [data, slotsByDay, day, slot]);

  const option = data?.options.find((o) => choice && o.kind === choice.kind && o.minutes === choice.minutes) ?? null;
  const daySlots = (day && slotsByDay.get(day)) || [];
  // A package that can pay for this lesson (regular, same length, not expiring before the time).
  const ownPackage =
    option?.kind === "regular"
      ? ((data?.packages ?? []).filter((k) => k.minutes === option.minutes && k.left > 0 && (!slot || !k.expiresAt || Date.parse(k.expiresAt) >= Date.parse(slot))).sort((a, b) => Date.parse(a.expiresAt ?? "9999") - Date.parse(b.expiresAt ?? "9999"))[0] ?? null)
      : null;
  const fromPackage = Boolean(ownPackage && usePackage);
  const offers = (data?.offers ?? []).filter((o) => o.minutes === (option?.kind === "regular" ? option.minutes : 60));

  async function buy(o: PackageOffer) {
    setBuying(`${o.lessons}-${o.minutes}`);
    setError(null);
    const res = await fetch("/api/packages", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tutorId: tutor.id, lessons: o.lessons, minutes: o.minutes }) }).catch(() => null);
    const d = (await res?.json().catch(() => ({}))) as { id?: number; error?: string };
    if (res?.status === 401) return window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    if (res?.ok && d.id) return window.location.assign(`/checkout/package/${d.id}`);
    setBuying(null);
    setError(d.error || "We couldn't set up that package. Please try again.");
  }

  async function confirm() {
    if (!option || !slot) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/bookings", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tutorId: tutor.id, startsAt: slot, kind: option.kind, minutes: option.minutes, subjectId, note, timezone: tz, packageId: fromPackage ? ownPackage?.id : undefined }),
    }).catch(() => null);
    const d = (await res?.json().catch(() => ({}))) as { booking?: Held; providers?: Provider[]; error?: string };
    setBusy(false);
    if (res?.ok && d.booking) return setDone({ booking: d.booking, providers: d.providers ?? [] });
    setError(d.error || "We couldn't book that lesson. Please try again.");
    if (res?.status === 409) {
      setSlot(null);
      void load(option.minutes);
    }
  }

  if (done?.booking.paidFromPackage) {
    const b = done.booking;
    const confirmed = b.status === "confirmed";
    return (
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center ring-1 ring-slate-200/70">
        <span className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${confirmed ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{confirmed ? <CheckCircle2 size={32} /> : <Hourglass size={30} />}</span>
        <h2 className="mt-5 font-heading text-2xl font-bold text-slate-900">{confirmed ? "Your lesson is booked" : "Request sent"}</h2>
        <p className="mt-2 text-slate-600">
          {fmtDay(b.startsAt, tz)}, {fmtRange(b.startsAt, b.endsAt, tz)} with {tutor.name}.
          <br />
          {confirmed ? "Paid from your package." : `Paid from your package. ${tutor.name.split(" ")[0]} will confirm soon; if they can't, the lesson goes back into your package.`}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/student/lessons" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 font-semibold text-white hover:bg-brand-800">
            <CalendarCheck size={18} /> My lessons
          </Link>
          <button
            type="button"
            onClick={() => {
              setDone(null);
              setSlot(null);
              void load(option?.minutes);
            }}
            className="inline-flex h-12 items-center justify-center rounded-xl px-5 font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Book another
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    const b = done.booking;
    return (
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200/70">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Almost done</p>
          <h2 className="mt-1 font-heading text-2xl font-bold text-slate-900">Pay to {data?.instant ? "confirm" : "send your request"}</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Clock size={17} className="mt-0.5 text-slate-400" />
              <dd className="text-slate-800">{option?.kind === "trial" ? `Trial lesson · ${option.minutes} min` : `${Math.round((Date.parse(b.endsAt) - Date.parse(b.startsAt)) / 60000)}-minute lesson`} with {tutor.name}</dd>
            </div>
            <div className="flex items-start gap-3">
              <CalendarDays size={17} className="mt-0.5 text-slate-400" />
              <dd className="text-slate-800">
                {fmtDay(b.startsAt, tz)}
                <br />
                {fmtRange(b.startsAt, b.endsAt, tz)}
              </dd>
            </div>
          </dl>
          <div className="mt-5 flex items-baseline justify-between border-t border-slate-100 pt-4">
            <span className="text-sm text-slate-500">Total</span>
            <span className="font-heading text-2xl font-bold text-slate-900">{money(b.price, b.currency)}</span>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {data?.instant ? "Your lesson is confirmed as soon as payment goes through." : `${tutor.name.split(" ")[0]} then has until the lesson to accept; if they decline you get a full refund.`} Free cancellation up to {cancellationHours} hours before.
          </p>
        </section>
        <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200/70">
          <h3 className="font-heading text-lg font-bold text-slate-900">Payment method</h3>
          <div className="mt-4">
            <PayStep bookingId={b.id} amount={b.price} currency={b.currency} holdUntil={b.holdUntil} providers={done.providers} />
          </div>
          <button type="button" onClick={async () => {
              // Release the held time before choosing another.
              await fetch(`/api/bookings/${b.id}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel", reason: "Picked another time" }) }).catch(() => null);
              setDone(null);
              setSlot(null);
              void load(option?.minutes);
            }} className="mt-3 w-full text-center text-sm font-medium text-slate-500 hover:text-brand-700">
            Pick a different time
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-6">
        {/* 1. Lesson type */}
        <section className="rounded-3xl bg-white p-5 ring-1 ring-slate-200/70 sm:p-6">
          <h2 className="font-heading text-lg font-bold text-slate-900">1. Choose a lesson</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(data?.options ?? []).map((o) => {
              const on = choice?.kind === o.kind && choice.minutes === o.minutes;
              return (
                <button
                  key={`${o.kind}-${o.minutes}`}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    if (choice?.minutes !== o.minutes) setSlot(null);
                    setChoice({ kind: o.kind, minutes: o.minutes });
                  }}
                  className={`rounded-2xl p-4 text-left ring-1 transition ${on ? "bg-brand-50 ring-2 ring-brand-600" : "bg-white ring-slate-200 hover:ring-brand-300"}`}
                >
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                    {o.kind === "trial" && <Sparkles size={15} className="text-emerald-600" />}
                    {o.kind === "trial" ? "Trial" : `${o.minutes} min`}
                  </span>
                  <span className="mt-1 block font-heading text-xl font-bold text-slate-900">{money(o.price, data!.currency)}</span>
                  <span className="text-xs text-slate-500">{o.kind === "trial" ? `${o.minutes} min, first lesson` : (data?.packages ?? []).some((k) => k.minutes === o.minutes && k.left > 0) ? "In your package" : "Regular lesson"}</span>
                </button>
              );
            })}
            {!data && Array.from({ length: 4 }, (_, i) => <div key={i} className="h-[6.5rem] animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        </section>

        {offers.length > 0 && !ownPackage && (
          <section className="rounded-3xl bg-gradient-to-br from-brand-50 to-white p-5 ring-1 ring-brand-100 sm:p-6">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-brand-700" />
              <h2 className="font-heading text-lg font-bold text-slate-900">Save with a package</h2>
            </div>
            <p className="mt-1 text-sm text-slate-600">Pay once for several {offers[0]!.minutes}-minute lessons and book them whenever suits you. Cancel in time and the lesson goes back into your package.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {offers.map((o) => (
                <div key={`${o.lessons}-${o.minutes}`} className="flex flex-col rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <span className="text-sm font-semibold text-slate-900">{o.lessons} lessons</span>
                  <span className="mt-1 font-heading text-xl font-bold text-slate-900">{money(o.price, data!.currency)}</span>
                  <span className="text-xs text-slate-500">
                    {money(o.perLesson, data!.currency)} a lesson · <span className="font-semibold text-emerald-700">save {o.discountPercent}%</span>
                  </span>
                  <button type="button" onClick={() => buy(o)} disabled={buying !== null} className="mt-3 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                    {buying === `${o.lessons}-${o.minutes}` ? <Loader2 size={16} className="animate-spin" /> : null} Buy {o.lessons} lessons
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 2. Day and time */}
        <section className="rounded-3xl bg-white p-5 ring-1 ring-slate-200/70 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-heading text-lg font-bold text-slate-900">2. Pick a day and time</h2>
            <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
              <span className="shrink-0">Times in</span>
              <Combobox aria-label="Time zone" size="sm" className="w-[15rem] max-w-full" options={withCurrent(zoneOptions, tz)} value={tz} onChange={(v) => v && setTz(v)} searchPlaceholder="Search a city or country" />
            </div>
          </div>

          {data && !data.hasHours ? (
            <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-center text-slate-600">{tutor.name.split(" ")[0]} hasn&apos;t opened their calendar yet. Save them and check back soon.</p>
          ) : data && !data.slots.length ? (
            <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-center text-slate-600">No open times in the next {data.windowDays} days. Try a shorter lesson or check back soon.</p>
          ) : (
            <>
              <div className="-mx-1 mt-4 flex snap-x gap-2 overflow-x-auto px-1 pb-2" role="listbox" aria-label="Days">
                {days.map((k) => {
                  const n = slotsByDay.get(k)?.length ?? 0;
                  const on = day === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      role="option"
                      aria-selected={on}
                      disabled={!n}
                      onClick={() => (setDay(k), setSlot(null))}
                      className={`flex w-[4.25rem] shrink-0 snap-start flex-col items-center rounded-2xl py-2.5 ring-1 transition ${on ? "bg-brand-700 text-white ring-brand-700" : n ? "bg-white text-slate-800 ring-slate-200 hover:ring-brand-300" : "bg-slate-50 text-slate-300 ring-slate-100"}`}
                    >
                      <span className="text-xs font-medium">{k === today ? "Today" : DAYS_SHORT[weekdayOfKey(k)]}</span>
                      <span className="text-lg font-bold">{Number(k.slice(8))}</span>
                      <span className={`text-[11px] ${on ? "text-white/80" : "text-slate-500"}`}>{n ? `${n} open` : fmtDay(`${k}T12:00:00Z`, "UTC", { month: "short" })}</span>
                    </button>
                  );
                })}
              </div>
              {loading && !data ? (
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="h-11 animate-pulse rounded-xl bg-slate-100" />
                  ))}
                </div>
              ) : (
                day && (
                  <div className={`mt-4 space-y-4 ${loading ? "opacity-50" : ""}`}>
                    <p className="text-sm font-semibold text-slate-700">{fmtDay(`${day}T12:00:00Z`, "UTC")}</p>
                    {PERIODS.map((p) => {
                      const items = daySlots.filter((s) => {
                        const h = zonedParts(Date.parse(s), tz).hour;
                        return h >= p.from && h < p.to;
                      });
                      if (!items.length) return null;
                      return (
                        <div key={p.key}>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{p.key}</p>
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                            {items.map((s) => (
                              <button
                                key={s}
                                type="button"
                                aria-pressed={slot === s}
                                disabled={loading}
                                onClick={() => setSlot(s)}
                                className={`h-11 rounded-xl text-sm font-semibold ring-1 transition ${slot === s ? "bg-brand-700 text-white ring-brand-700" : "bg-white text-slate-800 ring-slate-200 hover:bg-brand-50 hover:ring-brand-300"}`}
                              >
                                {fmtTime(s, tz)}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </>
          )}
        </section>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200/70 sm:p-6">
          <div className="flex items-center gap-3">
            {tutor.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tutor.photo} alt="" className="h-12 w-12 rounded-2xl object-cover" />
            ) : (
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-700 font-bold text-white">{tutor.name.charAt(0)}</span>
            )}
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Your lesson with</p>
              <p className="truncate font-heading text-lg font-bold text-slate-900">{tutor.name}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Clock size={17} className="mt-0.5 text-slate-400" />
              <dd className="text-slate-800">{option ? (option.kind === "trial" ? `Trial lesson · ${option.minutes} min` : `${option.minutes}-minute lesson`) : "Choose a lesson"}</dd>
            </div>
            <div className="flex items-start gap-3">
              <CalendarDays size={17} className="mt-0.5 text-slate-400" />
              <dd className={slot ? "text-slate-800" : "text-slate-400"}>
                {slot && option ? (
                  <>
                    {fmtDay(slot, tz)}
                    <br />
                    {fmtRange(slot, new Date(Date.parse(slot) + option.minutes * 60_000), tz)} <span className="text-slate-500">({tzLabel(tz, Date.parse(slot)).split(" (")[1]?.replace(")", "")})</span>
                  </>
                ) : (
                  "Pick a time"
                )}
              </dd>
            </div>
          </dl>
          {tutor.subjects.length > 1 && (
            <div className="mt-5">
              <span className="text-sm font-semibold text-slate-800">Subject</span>
              <Combobox aria-label="Subject" size="sm" className="mt-1.5" options={tutor.subjects.map((x) => ({ value: x.id, label: x.name }))} value={subjectId} onChange={(v) => v != null && setSubjectId(v)} />
            </div>
          )}
          <label className="mt-4 block">
            <span className="text-sm font-semibold text-slate-800">Note for {tutor.name.split(" ")[0]} (optional)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={3} placeholder="What would you like to work on?" className={`${controlCls} mt-1.5 py-2.5 text-sm`} />
          </label>
          {ownPackage && (
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-emerald-50 p-3.5 ring-1 ring-emerald-200">
              <input type="checkbox" checked={usePackage} onChange={(e) => setUsePackage(e.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-600" />
              <span className="text-sm">
                <span className="block font-semibold text-emerald-900">Use a lesson from my package</span>
                <span className="text-emerald-800">
                  {ownPackage.left} {ownPackage.left === 1 ? "lesson" : "lessons"} left{ownPackage.expiresAt ? `, book by ${fmtDay(ownPackage.expiresAt, tz, { month: "short", day: "numeric" })}` : ""}
                </span>
              </span>
            </label>
          )}
          <div className="mt-5 flex items-baseline justify-between border-t border-slate-100 pt-4">
            <span className="text-sm text-slate-500">Total</span>
            <span className="font-heading text-2xl font-bold text-slate-900">{fromPackage ? "Prepaid" : option && data ? money(option.price, data.currency) : "—"}</span>
          </div>
          {error && (
            <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {error}
            </p>
          )}
          <button type="button" onClick={confirm} disabled={!slot || !option || busy} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 font-semibold text-white transition hover:bg-brand-800 disabled:opacity-50">
            {busy ? <Loader2 size={18} className="animate-spin" /> : data?.instant ? <Zap size={18} /> : <CalendarCheck size={18} />}
            {fromPackage ? (data?.instant ? "Book lesson" : "Send request") : "Continue to payment"}
          </button>
          <p className="mt-3 text-center text-xs text-slate-500">{data?.instant ? "Instant booking: confirmed straight away." : `${tutor.name.split(" ")[0]} confirms requests personally.`} Free cancellation up to {cancellationHours} hours before.</p>
        </div>
      </aside>
    </div>
  );
}

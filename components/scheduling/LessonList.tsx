"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarX2, Inbox } from "lucide-react";
import type { LessonView } from "@/cms/scheduling/server";
import { dateKey, fmtDay } from "@/lib/time";
import { LessonCard } from "./LessonCard";

type Tab = "requests" | "upcoming" | "past" | "cancelled";

/** Tabbed list of a student's or tutor's lessons, grouped by day in the viewer's time zone. */
export function LessonList({ lessons, role, tz, cancellationHours, initialTab }: { lessons: LessonView[]; role: "student" | "tutor"; tz: string; cancellationHours: number; initialTab?: Tab }) {
  const groups = useMemo(() => {
    const requests = lessons.filter((l) => l.phase === "requested");
    const upcoming = lessons.filter((l) => l.phase === "upcoming" || (role === "student" && (l.phase === "requested" || l.phase === "payment")));
    const past = lessons.filter((l) => l.phase === "finished").reverse();
    const cancelled = lessons.filter((l) => l.phase === "cancelled").reverse();
    return { requests, upcoming, past, cancelled };
  }, [lessons, role]);

  const tabs: { key: Tab; label: string }[] = [
    ...(role === "tutor" ? [{ key: "requests" as Tab, label: "Requests" }] : []),
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
    { key: "cancelled", label: "Cancelled" },
  ];
  const [tab, setTab] = useState<Tab>(initialTab ?? (role === "tutor" && groups.requests.length ? "requests" : "upcoming"));
  const list = groups[tab];

  const byDay = useMemo(() => {
    const m = new Map<string, LessonView[]>();
    for (const l of list) {
      const k = dateKey(Date.parse(l.startsAt), tz);
      m.set(k, [...(m.get(k) ?? []), l]);
    }
    return [...m.entries()];
  }, [list, tz]);

  const today = dateKey(Date.now(), tz);
  const dayLabel = (k: string, sample: string) => (k === today ? `Today · ${fmtDay(sample, tz, { month: "long", day: "numeric" })}` : fmtDay(sample, tz));

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Lessons" className="flex gap-1 overflow-x-auto rounded-2xl bg-white p-1 ring-1 ring-slate-200/70 sm:inline-flex">
        {tabs.map((t) => {
          const n = groups[t.key].length;
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${tab === t.key ? "bg-brand-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {t.label}
              {n > 0 && <span className={`rounded-full px-1.5 text-xs ${tab === t.key ? "bg-white/20" : t.key === "requests" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{n}</span>}
            </button>
          );
        })}
      </div>

      {byDay.length ? (
        byDay.map(([k, items]) => (
          <section key={k} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{dayLabel(k, items[0]!.startsAt)}</h2>
            {items.map((l) => (
              <LessonCard key={l.id} lesson={l} role={role} tz={tz} cancellationHours={cancellationHours} />
            ))}
          </section>
        ))
      ) : (
        <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-slate-200/70">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">{tab === "requests" ? <Inbox size={26} /> : <CalendarX2 size={26} />}</span>
          <h2 className="mt-4 font-heading text-xl font-bold text-slate-900">
            {tab === "requests" ? "No requests waiting" : tab === "upcoming" ? "No upcoming lessons" : tab === "past" ? "No past lessons yet" : "Nothing cancelled"}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-slate-500">
            {tab === "upcoming" && role === "student"
              ? "Find a tutor and pick a time that suits you."
              : tab === "upcoming"
                ? "Lessons appear here as soon as students book you. Keep your availability up to date."
                : tab === "requests"
                  ? "When a student asks for a time, you'll accept or decline it here."
                  : "Your lesson history will show here."}
          </p>
          {tab === "upcoming" && (
            <Link href={role === "student" ? "/find-tutors" : "/tutor/availability"} className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800">
              {role === "student" ? "Find a tutor" : "Set availability"}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

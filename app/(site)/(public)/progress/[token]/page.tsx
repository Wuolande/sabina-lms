import { notFound } from "next/navigation";
import { BookOpen, CalendarDays, CheckCircle2, ClipboardList, Clock, Target, Trophy, XCircle } from "lucide-react";
import { getPayloadClient } from "@/cms/auth/session";
import { parentView } from "@/cms/progress/server";
import { fmtDay, fmtRange, safeTz } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Learning progress", robots: { index: false, follow: false } };

const card = "rounded-3xl bg-white p-5 ring-1 ring-slate-200/70 sm:p-6";

/** What a parent sees from the private link a student shared. Read-only. */
export default async function ParentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const v = await parentView(await getPayloadClient(), token);
  if (!v) notFound();
  const tz = safeTz(v.timezone);
  const tiles = [
    { icon: BookOpen, label: "Lessons taken", value: v.stats.lessons },
    { icon: Clock, label: "Hours learned", value: v.stats.hours },
    { icon: ClipboardList, label: "Homework done", value: `${v.stats.homeworkDone}/${v.stats.homeworkSet}` },
    { icon: XCircle, label: "Lessons missed", value: v.stats.missed },
  ];
  return (
    <div className="bg-slate-50 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Learning progress</p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">How {v.firstName} is getting on</h1>
          <p className="mt-2 text-slate-600">{v.firstName} shared this page with you. It updates as lessons happen. Times are in {tz.replace(/_/g, " ")}.</p>
        </header>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-3xl bg-white p-5 ring-1 ring-slate-200/70">
              <t.icon size={20} className="text-brand-600" />
              <p className="mt-3 font-heading text-3xl font-bold text-slate-900">{t.value}</p>
              <p className="text-sm text-slate-500">{t.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={card}>
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-900">
              <CalendarDays size={19} className="text-brand-600" /> Coming up
            </h2>
            {v.upcoming.length ? (
              <ul className="mt-4 space-y-3">
                {v.upcoming.map((l) => (
                  <li key={l.id} className="rounded-2xl bg-slate-50 p-3.5">
                    <p className="font-semibold text-slate-900">
                      {l.subject ?? "Lesson"} with {l.tutor}
                    </p>
                    <p className="text-sm text-slate-500">
                      {fmtDay(l.startsAt, tz)}, {fmtRange(l.startsAt, l.endsAt, tz)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No lessons booked right now.</p>
            )}
          </section>
          <section className={card}>
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-900">
              <Target size={19} className="text-brand-600" /> Goals
            </h2>
            {v.goals.length ? (
              <ul className="mt-4 space-y-4">
                {v.goals.map((g) => (
                  <li key={g.id}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-semibold text-slate-900">
                        {g.status === "achieved" && <Trophy size={15} className="text-emerald-600" />} {g.title}
                      </span>
                      <span className="shrink-0 text-slate-500">{g.status === "achieved" ? "Achieved" : `${g.progress}%`}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${g.status === "achieved" ? 100 : g.progress}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No goals set yet.</p>
            )}
          </section>
        </div>

        <section className={card}>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-900">
            <ClipboardList size={19} className="text-brand-600" /> Homework & quizzes
          </h2>
          {v.homework.length ? (
            <ul className="mt-4 divide-y divide-slate-100">
              {v.homework.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{h.title}</p>
                    <p className="text-sm text-slate-500">
                      {h.kind === "quiz" ? "Quiz" : "Homework"} from {h.tutor}
                      {h.dueAt ? ` · due ${fmtDay(h.dueAt, tz, { month: "short", day: "numeric" })}` : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${h.late ? "bg-rose-50 text-rose-700 ring-rose-200" : h.status === "assigned" ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-emerald-50 text-emerald-800 ring-emerald-200"}`}>
                    {h.late ? "Overdue" : h.status === "assigned" ? "To do" : h.kind === "quiz" ? `Scored ${h.score}/${h.outOf}` : h.status === "reviewed" ? "Marked" : "Handed in"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No homework set yet.</p>
          )}
        </section>

        <section className={card}>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-900">
            <BookOpen size={19} className="text-brand-600" /> Recent lessons
          </h2>
          {v.recent.length ? (
            <ul className="mt-4 space-y-4">
              {v.recent.map((l) => (
                <li key={l.id} className="flex gap-3">
                  {l.attended ? <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-emerald-600" aria-label="Attended" /> : <XCircle size={19} className="mt-0.5 shrink-0 text-rose-500" aria-label="Missed" />}
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {l.subject ?? "Lesson"} with {l.tutor} <span className="font-normal text-slate-500">· {fmtDay(l.startsAt, tz, { weekday: "short", month: "short", day: "numeric" })}</span>
                    </p>
                    {!l.attended && <p className="text-sm text-rose-700">Missed</p>}
                    {l.notes && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{l.notes}</p>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No lessons yet.</p>
          )}
        </section>
        <p className="text-center text-xs text-slate-400">This page is private to whoever has the link. {v.firstName} can turn it off at any time.</p>
      </div>
    </div>
  );
}

import Link from "next/link";
import { BookOpen, Clock, Flame, NotebookPen, Star, Users } from "lucide-react";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { studentProgress } from "@/cms/lessons/server";
import { listAssignments, listGoals, shareStatus } from "@/cms/progress/server";
import { GoalsBoard } from "@/components/progress/GoalsBoard";
import { HomeworkList } from "@/components/progress/HomeworkList";
import { ParentShare } from "@/components/progress/ParentShare";
import { PageHeader } from "@/components/portal/PageHeader";
import { fmtDay, safeTz } from "@/lib/time";

export const metadata = { title: "Progress" };
export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const user = await requireUser(["student"], "/student/progress");
  const payload = await getPayloadClient();
  const [p, goals, homework, share] = await Promise.all([studentProgress(payload, user), listGoals(payload, user, user.id), listAssignments(payload, user), shareStatus(payload, user)]);
  const todo = homework.filter((a) => a.status === "assigned");
  const tz = safeTz(user.timezone);
  const hours = Math.round((p.minutes / 60) * 10) / 10;
  const top = Math.max(1, ...p.subjects.map((s) => s.minutes));
  const tiles = [
    { icon: BookOpen, label: "Lessons", value: p.lessons },
    { icon: Clock, label: "Hours", value: hours },
    { icon: Users, label: "Tutors", value: p.tutors },
    { icon: Flame, label: "Week streak", value: p.streak },
  ];
  return (
    <div className="space-y-6">
      <PageHeader title="Progress" sub="Your lessons, goals, homework and what your tutors noted." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-3xl bg-white p-5 ring-1 ring-slate-200/70">
            <t.icon size={20} className="text-brand-600" />
            <p className="mt-3 font-heading text-3xl font-bold text-slate-900">{t.value}</p>
            <p className="text-sm text-slate-500">{t.label}</p>
          </div>
        ))}
      </div>

      {p.toReview.length > 0 && (
        <section className="rounded-3xl bg-amber-50 p-5 ring-1 ring-amber-200 sm:p-6">
          <h2 className="flex items-center gap-2 font-semibold text-amber-900">
            <Star size={18} className="fill-amber-400 text-amber-400" /> Rate your recent lessons
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {p.toReview.map((r) => (
              <li key={r.id}>
                <Link href={`/student/lessons/${r.id}`} className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-slate-800 ring-1 ring-amber-200 hover:bg-amber-100">
                  {r.tutor} · {fmtDay(r.date, tz, { month: "short", day: "numeric" })}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-3xl bg-white p-5 ring-1 ring-slate-200/70 sm:p-6">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900">My goals</h2>
            <p className="text-sm text-slate-500">Break a big goal into steps. Your tutors can see and update them too.</p>
          </div>
          <GoalsBoard initial={goals} />
        </section>
        <div className="space-y-6">
          <section className="space-y-3 rounded-3xl bg-white p-5 ring-1 ring-slate-200/70 sm:p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-heading text-lg font-bold text-slate-900">Homework to do</h2>
              <Link href="/student/homework" className="text-sm font-semibold text-brand-700 hover:underline">
                All homework
              </Link>
            </div>
            <HomeworkList items={todo.slice(0, 4)} viewer="student" tz={tz} empty="You're all caught up." />
          </section>
          <section className="space-y-3 rounded-3xl bg-white p-5 ring-1 ring-slate-200/70 sm:p-6">
            <h2 className="font-heading text-lg font-bold text-slate-900">Share with a parent</h2>
            <ParentShare initialPath={share.token ? `/progress/${share.token}` : null} />
          </section>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-5 ring-1 ring-slate-200/70 sm:p-6">
          <h2 className="font-heading text-lg font-bold text-slate-900">Time by subject</h2>
          {p.subjects.length ? (
            <ul className="mt-4 space-y-3">
              {p.subjects.map((s) => (
                <li key={s.name}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-800">{s.name}</span>
                    <span className="text-slate-500">{Math.round((s.minutes / 60) * 10) / 10} h</span>
                  </div>
                  <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-slate-100">
                    <span className="block h-full rounded-full bg-brand-600" style={{ width: `${(s.minutes / top) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Finish your first lesson and your time per subject shows here.</p>
          )}
        </section>
        <section className="rounded-3xl bg-white p-5 ring-1 ring-slate-200/70 sm:p-6">
          <h2 className="font-heading text-lg font-bold text-slate-900">Notes from your tutors</h2>
          {p.notes.length ? (
            <ul className="mt-4 space-y-4">
              {p.notes.map((n) => (
                <li key={n.id} className="flex gap-3">
                  <NotebookPen size={18} className="mt-0.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <Link href={`/student/lessons/${n.id}`} className="text-sm font-semibold text-slate-900 hover:text-brand-700">
                      {n.tutor}
                      {n.subject ? ` · ${n.subject}` : ""} · {fmtDay(n.date, tz, { month: "short", day: "numeric" })}
                    </Link>
                    <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap text-sm text-slate-600">{n.notes}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">When a tutor adds notes after a lesson, you&apos;ll find them here.</p>
          )}
        </section>
      </div>
    </div>
  );
}

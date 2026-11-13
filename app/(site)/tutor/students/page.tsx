import Link from "next/link";
import { MessageSquare, Users } from "lucide-react";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { tutorStudents } from "@/cms/lessons/server";
import { PersonAvatar } from "@/components/scheduling/LessonCard";
import { PageHeader } from "@/components/portal/PageHeader";
import { fmtDay, safeTz } from "@/lib/time";

export const metadata = { title: "My students" };
export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const user = await requireUser(["tutor"], "/tutor/students");
  const list = await tutorStudents(await getPayloadClient(), user);
  const tz = safeTz(user.timezone);
  return (
    <div className="space-y-6">
      <PageHeader title="My students" sub="Everyone you've taught or have a lesson booked with." />
      {list.length ? (
        <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {list.map((s) => (
            <li key={s.id} className="rounded-3xl bg-white p-5 ring-1 ring-slate-200/70">
              <div className="flex items-center gap-3">
                <PersonAvatar name={s.name} src={s.avatar} size={48} />
                <div className="min-w-0 flex-1">
                  <Link href={`/tutor/students/${s.id}`} className="block truncate font-semibold text-slate-900 hover:text-brand-700">{s.name}</Link>
                  <p className="truncate text-sm text-slate-500">{s.subjects.join(", ") || "No subject yet"}</p>
                </div>
                <Link href={`/tutor/messages?student=${s.id}`} aria-label={`Message ${s.name}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100">
                  <MessageSquare size={18} />
                </Link>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-slate-50 p-2.5">
                  <dt className="text-xs text-slate-500">Lessons</dt>
                  <dd className="font-heading text-lg font-bold text-slate-900">{s.done}</dd>
                </div>
                <div className="rounded-2xl bg-slate-50 p-2.5">
                  <dt className="text-xs text-slate-500">Hours</dt>
                  <dd className="font-heading text-lg font-bold text-slate-900">{Math.round((s.minutes / 60) * 10) / 10}</dd>
                </div>
                <div className="rounded-2xl bg-slate-50 p-2.5">
                  <dt className="text-xs text-slate-500">Next</dt>
                  <dd className="truncate pt-1 text-sm font-semibold text-slate-900">{s.next ? fmtDay(s.next, tz, { month: "short", day: "numeric" }) : "—"}</dd>
                </div>
              </dl>
              <Link href={`/tutor/students/${s.id}`} className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-slate-50 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100">
                Homework, quizzes & goals
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-slate-200/70">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <Users size={26} />
          </span>
          <h2 className="mt-4 font-heading text-xl font-bold text-slate-900">No students yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-slate-500">Students appear here once they book a lesson with you.</p>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { tutorStudents } from "@/cms/lessons/server";
import { listAssignments, listGoals, teaches } from "@/cms/progress/server";
import { PersonAvatar } from "@/components/scheduling/LessonCard";
import { AssignmentComposer } from "@/components/progress/AssignmentComposer";
import { HomeworkList } from "@/components/progress/HomeworkList";
import { GoalsBoard } from "@/components/progress/GoalsBoard";
import { fmtDay, safeTz } from "@/lib/time";

export const metadata = { title: "Student" };
export const dynamic = "force-dynamic";

/** One student, from the tutor's side: lessons so far, homework, quizzes and goals. */
export default async function TutorStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(["tutor"], `/tutor/students/${id}`);
  const payload = await getPayloadClient();
  const studentId = Number(id);
  if (!studentId || !(await teaches(payload, user.id, studentId))) notFound();
  const [all, items, goals] = await Promise.all([tutorStudents(payload, user), listAssignments(payload, user, { studentId }), listGoals(payload, user, studentId)]);
  const s = all.find((x) => x.id === studentId);
  if (!s) notFound();
  const tz = safeTz(user.timezone);
  return (
    <div className="space-y-6">
      <Link href="/tutor/students" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
        <ArrowLeft size={16} /> My students
      </Link>
      <header className="flex flex-wrap items-center gap-4 rounded-3xl bg-white p-5 ring-1 ring-slate-200/70 sm:p-6">
        <PersonAvatar name={s.name} src={s.avatar} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-2xl font-bold text-slate-900">{s.name}</h1>
          <p className="text-sm text-slate-500">
            {s.done} {s.done === 1 ? "lesson" : "lessons"} · {Math.round((s.minutes / 60) * 10) / 10} h{s.subjects.length ? ` · ${s.subjects.join(", ")}` : ""}
            {s.next ? ` · next ${fmtDay(s.next, tz, { weekday: "short", month: "short", day: "numeric" })}` : ""}
          </p>
        </div>
        <Link href={`/tutor/messages?student=${s.id}`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
          <MessageSquare size={17} /> Message
        </Link>
      </header>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="space-y-4 rounded-3xl bg-white p-5 ring-1 ring-slate-200/70 sm:p-6">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900">Homework & quizzes</h2>
            <p className="text-sm text-slate-500">Practice between lessons. Quizzes mark themselves.</p>
          </div>
          <AssignmentComposer studentId={s.id} studentName={s.name} />
          <HomeworkList items={items} viewer="tutor" tz={tz} empty="Nothing set yet." />
        </section>
        <section className="space-y-4 rounded-3xl bg-white p-5 ring-1 ring-slate-200/70 sm:p-6">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900">Goals</h2>
            <p className="text-sm text-slate-500">Shared with {s.name.split(" ")[0]}. Either of you can tick off steps.</p>
          </div>
          <GoalsBoard initial={goals} studentId={s.id} who={s.name.split(" ")[0]} />
        </section>
      </div>
    </div>
  );
}

import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { listAssignments } from "@/cms/progress/server";
import { PageHeader } from "@/components/portal/PageHeader";
import { HomeworkList } from "@/components/progress/HomeworkList";
import { safeTz } from "@/lib/time";

export const metadata = { title: "Homework" };
export const dynamic = "force-dynamic";

export default async function StudentHomeworkPage() {
  const user = await requireUser(["student"], "/student/homework");
  const items = await listAssignments(await getPayloadClient(), user);
  const tz = safeTz(user.timezone);
  const todo = items.filter((a) => a.status === "assigned");
  const done = items.filter((a) => a.status !== "assigned");
  return (
    <div className="space-y-6">
      <PageHeader title="Homework" sub="Practice and quizzes your tutors set between lessons." />
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-bold text-slate-900">To do</h2>
        <HomeworkList items={todo} viewer="student" tz={tz} empty="You're all caught up." />
      </section>
      {done.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold text-slate-900">Done</h2>
          <HomeworkList items={done} viewer="student" tz={tz} empty="" />
        </section>
      )}
    </div>
  );
}

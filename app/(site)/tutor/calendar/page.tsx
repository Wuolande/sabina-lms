import Link from "next/link";
import { Clock, Inbox, List } from "lucide-react";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { listLessons, ownSchedule } from "@/cms/scheduling/server";
import { WeekCalendar } from "@/components/scheduling/WeekCalendar";
import { PageHeader, ghostCls } from "@/components/portal/PageHeader";
import { safeTz } from "@/lib/time";

export const metadata = { title: "Schedule" };
export const dynamic = "force-dynamic";

export default async function TutorCalendarPage() {
  const user = await requireUser(["tutor"], "/tutor/calendar");
  const payload = await getPayloadClient();
  const [lessons, schedule] = await Promise.all([listLessons(payload, user, { from: new Date(Date.now() - 120 * 86400_000) }), ownSchedule(payload, user)]);
  const requests = lessons.filter((l) => l.phase === "requested").length;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        sub="Your lessons and open hours, week by week."
        actions={
          <>
            <Link href="/tutor/lessons" className={ghostCls}>
              <List size={17} /> Lessons
            </Link>
            <Link href="/tutor/availability" className={ghostCls}>
              <Clock size={17} /> Edit hours
            </Link>
          </>
        }
      />
      {requests > 0 && (
        <Link href="/tutor/lessons" className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100">
          <Inbox size={20} /> <span className="font-semibold">{requests} lesson request{requests > 1 ? "s" : ""} waiting for your reply</span>
        </Link>
      )}
      {!schedule.weekly?.length && (
        <Link href="/tutor/availability" className="flex items-center gap-3 rounded-2xl bg-brand-50 p-4 text-brand-900 ring-1 ring-brand-200 hover:bg-brand-100">
          <Clock size={20} /> <span className="font-semibold">Set your weekly hours so students can book you</span>
        </Link>
      )}
      <WeekCalendar
        lessons={lessons}
        tz={safeTz(user.timezone)}
        role="tutor"
        availability={{ timezone: safeTz(schedule.timezone), weekly: (schedule.weekly ?? []).map((w) => ({ day: Number(w.day), start: w.start, end: w.end })), timeOff: (schedule.timeOff ?? []).map((t) => ({ from: t.from, to: t.to })) }}
      />
    </div>
  );
}

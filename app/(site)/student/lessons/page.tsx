import Link from "next/link";
import { CalendarDays, Search } from "lucide-react";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { getPolicies, listLessons } from "@/cms/scheduling/server";
import { LessonList } from "@/components/scheduling/LessonList";
import { PageHeader, buttonCls, ghostCls } from "@/components/portal/PageHeader";
import { safeTz } from "@/lib/time";

export const metadata = { title: "My lessons" };
export const dynamic = "force-dynamic";

export default async function StudentLessonsPage() {
  const user = await requireUser(["student"], "/student/lessons");
  const payload = await getPayloadClient();
  const [lessons, policies] = await Promise.all([listLessons(payload, user), getPolicies(payload)]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="My lessons"
        sub="Upcoming lessons, requests waiting for a tutor, and your history."
        actions={
          <>
            <Link href="/student/calendar" className={ghostCls}>
              <CalendarDays size={17} /> Calendar
            </Link>
            <Link href="/find-tutors" className={buttonCls}>
              <Search size={17} /> Book a lesson
            </Link>
          </>
        }
      />
      <LessonList lessons={lessons} role="student" tz={safeTz(user.timezone)} cancellationHours={policies.cancellationRefundHours} />
    </div>
  );
}

import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { getPolicies, listLessons } from "@/cms/scheduling/server";
import { LessonList } from "@/components/scheduling/LessonList";
import { PageHeader, ghostCls } from "@/components/portal/PageHeader";
import { safeTz } from "@/lib/time";

export const metadata = { title: "Lessons" };
export const dynamic = "force-dynamic";

export default async function TutorLessonsPage() {
  const user = await requireUser(["tutor"], "/tutor/lessons");
  const payload = await getPayloadClient();
  const [lessons, policies] = await Promise.all([listLessons(payload, user), getPolicies(payload)]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Lessons"
        sub="Answer requests, see what's coming up and review past lessons."
        actions={
          <>
            <Link href="/tutor/calendar" className={ghostCls}>
              <CalendarDays size={17} /> Schedule
            </Link>
            <Link href="/tutor/availability" className={ghostCls}>
              <Clock size={17} /> Availability
            </Link>
          </>
        }
      />
      <LessonList lessons={lessons} role="tutor" tz={safeTz(user.timezone)} cancellationHours={policies.cancellationRefundHours} />
    </div>
  );
}

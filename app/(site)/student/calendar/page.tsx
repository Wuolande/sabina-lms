import Link from "next/link";
import { List } from "lucide-react";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { listLessons } from "@/cms/scheduling/server";
import { WeekCalendar } from "@/components/scheduling/WeekCalendar";
import { PageHeader, ghostCls } from "@/components/portal/PageHeader";
import { safeTz } from "@/lib/time";

export const metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

export default async function StudentCalendarPage() {
  const user = await requireUser(["student"], "/student/calendar");
  const lessons = await listLessons(await getPayloadClient(), user, { from: new Date(Date.now() - 120 * 86400_000) });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        sub="Your lessons week by week."
        actions={
          <Link href="/student/lessons" className={ghostCls}>
            <List size={17} /> List view
          </Link>
        }
      />
      <WeekCalendar lessons={lessons} tz={safeTz(user.timezone)} role="student" />
    </div>
  );
}

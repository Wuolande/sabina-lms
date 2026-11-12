import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { ownSchedule } from "@/cms/scheduling/server";
import { ownTutorProfile } from "@/cms/tutors/server";
import { AvailabilityEditor } from "@/components/scheduling/AvailabilityEditor";
import { PageHeader } from "@/components/portal/PageHeader";
import { dateKey, safeTz } from "@/lib/time";

export const metadata = { title: "Availability" };
export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const user = await requireUser(["tutor"], "/tutor/availability");
  const payload = await getPayloadClient();
  const [s, profile] = await Promise.all([ownSchedule(payload, user), ownTutorProfile(payload, user)]);
  const tz = safeTz(s.timezone);
  return (
    <div className="space-y-6">
      <PageHeader title="Availability" sub="When students can book you. Changes apply to new bookings straight away." />
      {profile.status !== "approved" && (
        <p className="rounded-2xl bg-brand-50 p-4 text-sm text-brand-900 ring-1 ring-brand-200">You can set your hours now. Students can book you once your application is approved.</p>
      )}
      <AvailabilityEditor
        todayKey={dateKey(Date.now(), tz)}
        initial={{
          timezone: tz,
          weekly: (s.weekly ?? []).map((w) => ({ day: Number(w.day), start: w.start, end: w.end })),
          timeOff: (s.timeOff ?? []).map((t) => ({ from: t.from, to: t.to, note: t.note ?? "" })),
          noticeHours: s.noticeHours ?? 12,
          bufferMinutes: s.bufferMinutes ?? 0,
          instantBooking: s.instantBooking ?? true,
        }}
      />
    </div>
  );
}

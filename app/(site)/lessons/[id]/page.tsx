import { notFound, redirect } from "next/navigation";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { lessonDetail } from "@/cms/lessons/server";
import { LessonRoom } from "@/components/lesson-room/LessonRoom";
import { safeTz } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Classroom", robots: { index: false } };

/** The live classroom. Outside the lesson window it sends people to the lesson page instead. */
export default async function ClassroomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(["student", "tutor"], `/lessons/${id}`);
  const l = await lessonDetail(await getPayloadClient(), user, Number(id));
  if (!l) notFound();
  if (!l.classroom) redirect(`/${l.role}/lessons/${l.id}`);
  return (
    <LessonRoom
      lesson={{ id: l.id, title: l.title, role: l.role, other: { name: l.other.name, avatar: l.other.avatar }, me: l.me, startsAt: l.startsAt, endsAt: l.endsAt, joinOpensAt: l.joinOpensAt, joinClosesAt: l.joinClosesAt, tz: safeTz(user.timezone) }}
    />
  );
}

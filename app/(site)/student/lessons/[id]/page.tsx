import { notFound } from "next/navigation";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { lessonDetail } from "@/cms/lessons/server";
import { LessonDetail } from "@/components/lesson-room/LessonDetail";
import { safeTz } from "@/lib/time";

export const metadata = { title: "Lesson" };
export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(["student"], `/student/lessons/${id}`);
  const l = await lessonDetail(await getPayloadClient(), user, Number(id));
  if (!l) notFound();
  return <LessonDetail l={l} tz={safeTz(user.timezone)} />;
}

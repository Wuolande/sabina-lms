import { notFound } from "next/navigation";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { courseView } from "@/cms/academy/server";
import { CoursePlayer } from "@/components/academy/CoursePlayer";
import { RichText } from "@/components/content/RichText";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["tutor"], "/tutor/training");
  const c = await courseView(await getPayloadClient(), user, (await params).slug).catch(() => null);
  return { title: c?.title ?? "Academy" };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(["tutor"], `/tutor/training/${slug}`);
  const course = await courseView(await getPayloadClient(), user, slug).catch(() => null);
  if (!course) notFound();
  const { lessons, ...rest } = course;
  return <CoursePlayer course={{ ...rest, lessons: lessons.map(({ body: _body, ...l }) => l) }} bodies={lessons.map((l) => <RichText key={l.id} data={l.body} />)} />;
}

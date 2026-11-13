import { notFound } from "next/navigation";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { getAssignment } from "@/cms/progress/server";
import { HomeworkPage } from "@/components/progress/HomeworkPage";
import { safeTz } from "@/lib/time";

export const metadata = { title: "Homework" };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(["student"], `/student/homework/${id}`);
  const a = await getAssignment(await getPayloadClient(), user, Number(id));
  if (!a) notFound();
  return <HomeworkPage a={a} viewer="student" tz={safeTz(user.timezone)} />;
}

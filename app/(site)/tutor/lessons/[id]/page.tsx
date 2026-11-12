import { redirect } from "next/navigation";

/** Lesson rooms arrive with the classroom; until then a lesson link opens the list. */
export default function LessonPage() {
  redirect("/tutor/lessons");
}

import { adminSupabase } from "@/src/shared/database/supabase";
import { SubjectsListingClient } from "@/components/subjects/SubjectsListingClient";
import { Subject } from "@/types";

export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  let subjects: Subject[] = [];

  try {
    const { data } = await adminSupabase
      .from("subjects")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (data) {
      subjects = data.map((d) => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
        category: d.category || "General",
        description: d.description || "",
        popular: Boolean(d.popular),
        tutorCount: d.tutor_count || 0,
      }));
    }
  } catch (err) {
    console.error("[SubjectsPage] SSR load error:", err);
  }

  return <SubjectsListingClient initialSubjects={subjects} />;
}

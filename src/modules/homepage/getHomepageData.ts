import { adminSupabase } from "@/src/shared/database/supabase";
import { TutorProfile, Subject } from "@/types";

export const DEFAULT_HERO_IMAGE =
  "https://res.cloudinary.com/vtjhrq1w/image/upload/v1787809733/sabina/avatars/mf1o6onssnolztsrgdmt.png";

export interface HomepageServerData {
  cms: any | null;
  featuredTutors: TutorProfile[];
  popularSubjects: Subject[];
}

export async function getHomepageServerData(): Promise<HomepageServerData> {
  try {
    // 1. Fetch active CMS content directly from Supabase
    const cmsPromise = adminSupabase
      .from("platform_homepage_content")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (!data) return null;
        const stats = data.stats_section || {};
        if (stats.stat4) {
          stats.stat4.suffix = (stats.stat4.suffix || "").replace(/[^\x20-\x7E]/g, "").trim();
        }
        return {
          id: data.id,
          heroSection: data.hero_section,
          statsSection: stats,
          categoriesSection: data.categories_section,
          featuredTutorsSection: data.featured_tutors_section,
          classroomTourSection: data.classroom_tour_section,
          howItWorksSection: data.how_it_works_section,
          becomeTutorSection: data.become_tutor_section,
          faqSection: data.faq_section,
          updatedAt: data.updated_at,
        };
      })
      .catch((err) => {
        console.error("[getHomepageServerData] CMS fetch error:", err);
        return null;
      });

    // 2. Fetch featured tutors
    const tutorsPromise = adminSupabase
      .rpc("get_marketplace_tutors", {
        p_is_featured: true,
        p_limit: 4,
        p_offset: 0,
        p_sort_by: "popularity",
      })
      .then(({ data }) => (data?.tutors as TutorProfile[]) || [])
      .catch((err) => {
        console.error("[getHomepageServerData] Tutors fetch error:", err);
        return [] as TutorProfile[];
      });

    // 3. Fetch popular subjects
    const subjectsPromise = adminSupabase
      .from("subjects")
      .select(`
        id,
        name,
        slug,
        category,
        description,
        is_active,
        is_featured,
        tutors:tutor_subjects(count)
      `)
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("name", { ascending: true })
      .limit(12)
      .then(({ data }) => {
        return (data || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          category: s.category,
          description: s.description || `Master ${s.name} with certified 1-on-1 educators.`,
          iconName: s.icon_name || s.iconName || "BookOpen",
          tutorCount: s.tutors?.[0]?.count || 0,
        })) as Subject[];
      })
      .catch((err) => {
        console.error("[getHomepageServerData] Subjects fetch error:", err);
        return [] as Subject[];
      });

    const [cms, featuredTutors, popularSubjects] = await Promise.all([
      cmsPromise,
      tutorsPromise,
      subjectsPromise,
    ]);

    return {
      cms,
      featuredTutors,
      popularSubjects,
    };
  } catch (err) {
    console.error("[getHomepageServerData] Unexpected error:", err);
    return {
      cms: null,
      featuredTutors: [],
      popularSubjects: [],
    };
  }
}

import { adminSupabase } from "@/src/shared/database/supabase";
import { Subject } from "@/types";
import { getPayloadClient } from "@/cms/auth/session";
import { searchTutors, subjectsWithCounts, type PublicTutor } from "@/cms/marketplace/public";

export { DEFAULT_HERO_IMAGE } from "./constants";

export interface HomepageServerData {
  cms: any | null;
  featuredTutors: PublicTutor[];
  currency: string;
  popularSubjects: Subject[];
}

export async function getHomepageServerData(): Promise<HomepageServerData> {
  try {
    // 1. Fetch active CMS content directly from Supabase
    const cmsPromise = (async () => {
      try {
        const { data } = await adminSupabase
          .from("platform_homepage_content")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

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
      } catch (err) {
        console.error("[getHomepageServerData] CMS fetch error:", err);
        return null;
      }
    })();

    // 2. Featured tutors (Payload): featured first, then best rated.
    const payload = await getPayloadClient();
    const tutorsPromise = searchTutors(payload, { sort: "recommended" })
      .then((r) => ({ tutors: r.tutors.slice(0, 4), currency: r.policies.currency }))
      .catch(() => ({ tutors: [] as PublicTutor[], currency: "USD" }));

    // 3. Popular subjects (Payload): featured first, with tutor counts.
    const subjectsPromise = subjectsWithCounts(payload)
      .then((list) =>
        [...list]
          .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.tutorCount - a.tutorCount)
          .slice(0, 12)
          .map((s) => ({ id: String(s.id), name: s.name, slug: s.slug, category: s.category, description: s.description, iconName: s.icon, tutorCount: s.tutorCount }) as unknown as Subject),
      )
      .catch(() => [] as Subject[]);

    const [cms, featured, popularSubjects] = await Promise.all([cmsPromise, tutorsPromise, subjectsPromise]);

    return {
      cms,
      featuredTutors: featured.tutors,
      currency: featured.currency,
      popularSubjects,
    };
  } catch (err) {
    console.error("[getHomepageServerData] Unexpected error:", err);
    return {
      cms: null,
      featuredTutors: [],
      currency: "USD",
      popularSubjects: [],
    };
  }
}

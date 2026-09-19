import { PageLayout } from "@/components/cms/PageLayout";
import { adminSupabase } from "@/src/shared/database/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  try {
    const { data: page } = await adminSupabase.rpc("get_cms_page_by_slug", {
      p_slug: "about",
    });

    if (page?.metaTitle || page?.title) {
      return {
        title: page.metaTitle || `${page.title} | Sabina Edge LMS`,
        description: page.metaDescription || "Discover the story, mission, and technology behind Sabina Edge — the elite 1-on-1 tutoring platform.",
      };
    }
  } catch {
    // Fallback
  }

  return {
    title: "About Us & Educational Mission | Sabina Edge LMS",
    description: "Discover the story, mission, and technology behind Sabina Edge — the elite 1-on-1 tutoring platform.",
  };
}

export default async function AboutPage() {
  let page = null;
  try {
    const res = await adminSupabase.rpc("get_cms_page_by_slug", {
      p_slug: "about",
    });
    if (res?.data) {
      page = res.data;
    }
  } catch {
    // Fallback
  }

  if (!page) {
    try {
      const { data: row } = await adminSupabase
        .from("platform_pages")
        .select("*")
        .eq("slug", "about")
        .single();
      if (row) {
        page = {
          id: row.id,
          slug: row.slug,
          title: row.title,
          category: row.category,
          metaTitle: row.meta_title,
          metaDescription: row.meta_description,
          contentHtml: row.content_html,
          isPublished: row.is_published,
          readingTimeMinutes: row.reading_time_minutes || 6,
          updatedAt: row.updated_at,
        };
      }
    } catch {
      // Fallback
    }
  }

  const fallbackPage = {
    slug: "about",
    title: "About Sabina Edge & Our Educational Mission",
    category: "company",
    metaTitle: "About Us | Sabina Edge LMS",
    metaDescription: "Discover the story, mission, and technology behind Sabina Edge — the elite 1-on-1 tutoring platform.",
    readingTimeMinutes: 6,
    contentHtml: `
      <h2>Democratizing Elite 1-on-1 Education Globally</h2>
      <p>Sabina Edge was founded on a simple yet profound premise: <em>the most transformative learning occurs when passionate master educators and motivated students connect in an interactive, human, and focused online environment.</em></p>

      <h2>Our Three Core Pillars</h2>
      <ul>
        <li><strong>1. Uncompromising Educator Quality:</strong> Every tutor on our platform undergoes a rigorous 7-step credential verification process, degree authentication, and live teaching audit.</li>
        <li><strong>2. Frictionless In-Browser LMS:</strong> No third-party downloads required. Our purpose-built classroom provides sub-50ms HD video, collaborative whiteboard, LaTeX formula support, and synchronized homework notes.</li>
        <li><strong>3. Transparent & Ethical Pricing:</strong> Zero monthly subscription lock-ins. Pay only per lesson booked, with full refund guarantees and flexible rescheduling.</li>
      </ul>

      <h2>Our Global Community</h2>
      <p>Today, Sabina Edge connects thousands of students across 45+ countries with accredited professors, native language tutors, and industry experts in mathematics, coding, IELTS/TOEFL test preparation, and the sciences.</p>
    `,
  };

  return <PageLayout page={page || fallbackPage} />;
}

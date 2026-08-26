import { PageLayout } from "@/components/cms/PageLayout";
import { adminSupabase } from "@/src/shared/database/supabase";

export const metadata = {
  title: "About Us & Educational Mission | Sabina Edge LMS",
  description: "Discover the story, mission, and technology behind Sabina Edge — the elite 1-on-1 tutoring platform.",
};

export default async function AboutPage() {
  const { data: page } = await adminSupabase.rpc("get_cms_page_by_slug", {
    p_slug: "about",
  });

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

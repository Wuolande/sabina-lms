import { PageLayout } from "@/components/cms/PageLayout";
import { adminSupabase } from "@/src/shared/database/supabase";

export const metadata = {
  title: "Pricing Transparency & Satisfaction Guarantee | Sabina Edge LMS",
  description: "Transparent lesson pricing, zero subscription lock-ins, and 100% money-back satisfaction guarantees.",
};

export default async function PricingPage() {
  const { data: page } = await adminSupabase.rpc("get_cms_page_by_slug", {
    p_slug: "pricing",
  });

  const fallbackPage = {
    slug: "pricing",
    title: "Pricing Transparency & Satisfaction Guarantee",
    category: "company",
    metaTitle: "Pricing & Policies | Sabina Edge LMS",
    metaDescription: "Transparent lesson pricing, zero subscription lock-ins, and 100% money-back satisfaction guarantees.",
    readingTimeMinutes: 4,
    contentHtml: `
      <h2>Transparent Pricing. Zero Subscription Lock-Ins.</h2>
      <p>At Sabina Edge, you only pay per lesson booked. There are no monthly membership fees, no hidden charges, and no recurring commitments.</p>

      <h2>How Lesson Pricing Works</h2>
      <ul>
        <li><strong>Individual Tutor Rates:</strong> Tutors set their own hourly rates based on subject specialty, degree level, and experience (typically ranging from $20 to $120/hr).</li>
        <li><strong>Trial Lessons (25 Mins):</strong> Discounted intro sessions to assess tutor compatibility and align learning goals.</li>
        <li><strong>Standard Lessons (50 Mins):</strong> Deep dive curriculum practice with live whiteboard, homework review, and post-lesson summary notes.</li>
      </ul>

      <h2>100% Satisfaction Guarantee</h2>
      <p>If you are not completely satisfied with your first trial lesson with any new tutor, notify us within 24 hours. We will issue a 100% refund or transfer your credit to another tutor of your choice with zero hassle.</p>
    `,
  };

  return <PageLayout page={page || fallbackPage} />;
}

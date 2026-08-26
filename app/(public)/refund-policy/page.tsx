import { notFound } from "next/navigation";
import { PageLayout } from "@/components/cms/PageLayout";
import { adminSupabase } from "@/src/shared/database/supabase";

export const metadata = {
  title: "100% Satisfaction Guarantee & Refund Policy | Sabina Edge LMS",
  description: "Our commitment to student satisfaction, trial lesson guarantees, cancellation rules, and refund processing timelines.",
};

export default async function RefundPolicyPage() {
  const { data: page } = await adminSupabase.rpc("get_cms_page_by_slug", {
    p_slug: "refund-policy",
  });

  if (!page || !page.isPublished) {
    notFound();
  }

  return <PageLayout page={page} />;
}

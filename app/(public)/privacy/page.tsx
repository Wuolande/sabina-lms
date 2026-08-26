import { notFound } from "next/navigation";
import { PageLayout } from "@/components/cms/PageLayout";
import { adminSupabase } from "@/src/shared/database/supabase";

export const metadata = {
  title: "Privacy Policy & GDPR Data Protection | Sabina Edge LMS",
  description: "Learn how Sabina Edge collects, uses, protects, and handles your personal information, learning records, and biometric classroom data.",
};

export default async function PrivacyPage() {
  const { data: page } = await adminSupabase.rpc("get_cms_page_by_slug", {
    p_slug: "privacy",
  });

  if (!page || !page.isPublished) {
    notFound();
  }

  return <PageLayout page={page} />;
}

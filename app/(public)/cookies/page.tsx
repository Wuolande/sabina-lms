import { notFound } from "next/navigation";
import { PageLayout } from "@/components/cms/PageLayout";
import { adminSupabase } from "@/src/shared/database/supabase";

export const metadata = {
  title: "Cookie Policy & Tracking Technologies | Sabina Edge LMS",
  description: "Information on cookies, session storage, and analytics technologies used on Sabina Edge.",
};

export default async function CookiePolicyPage() {
  const { data: page } = await adminSupabase.rpc("get_cms_page_by_slug", {
    p_slug: "cookies",
  });

  if (!page || !page.isPublished) {
    notFound();
  }

  return <PageLayout page={page} />;
}

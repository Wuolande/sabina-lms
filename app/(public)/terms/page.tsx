import { notFound } from "next/navigation";
import { PageLayout } from "@/components/cms/PageLayout";
import { adminSupabase } from "@/src/shared/database/supabase";

export const metadata = {
  title: "Terms of Service & Platform Agreement | Sabina Edge LMS",
  description: "Official terms and conditions governing the use of Sabina Edge marketplace, 1-on-1 tutoring sessions, payments, and in-browser classrooms.",
};

export default async function TermsPage() {
  const { data: page } = await adminSupabase.rpc("get_cms_page_by_slug", {
    p_slug: "terms",
  });

  if (!page || !page.isPublished) {
    notFound();
  }

  return <PageLayout page={page} />;
}

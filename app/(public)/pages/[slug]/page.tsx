import { notFound } from "next/navigation";
import { PageLayout } from "@/components/cms/PageLayout";
import { adminSupabase } from "@/src/shared/database/supabase";

interface CustomPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CustomPageProps) {
  const { slug } = await params;
  const { data: page } = await adminSupabase.rpc("get_cms_page_by_slug", {
    p_slug: slug.toLowerCase(),
  });

  if (!page || !page.isPublished) {
    return {
      title: "Page Not Found | Sabina Edge LMS",
    };
  }

  return {
    title: page.metaTitle || `${page.title} | Sabina Edge LMS`,
    description: page.metaDescription || `Read ${page.title} on Sabina Edge.`,
  };
}

export default async function DynamicCustomPage({ params }: CustomPageProps) {
  const { slug } = await params;
  const { data: page } = await adminSupabase.rpc("get_cms_page_by_slug", {
    p_slug: slug.toLowerCase(),
  });

  if (!page || !page.isPublished) {
    notFound();
  }

  return <PageLayout page={page} />;
}

import { notFound } from "next/navigation";
import { PageLayout } from "@/components/cms/PageLayout";
import { adminSupabase } from "@/src/shared/database/supabase";

interface CustomPageProps {
  params: Promise<{ slug: string }>;
}

async function getPage(slug: string) {
  try {
    const { data: page, error } = await adminSupabase.rpc("get_cms_page_by_slug", {
      p_slug: slug.toLowerCase(),
    });

    if (!error && page) {
      return page;
    }
  } catch {
    // fallback
  }

  const { data: row } = await adminSupabase
    .from("platform_pages")
    .select("*")
    .eq("slug", slug.toLowerCase())
    .single();

  if (row) {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      category: row.category,
      metaTitle: row.meta_title,
      metaDescription: row.meta_description,
      contentHtml: row.content_html,
      isPublished: row.is_published,
      readingTimeMinutes: row.reading_time_minutes || 3,
      updatedAt: row.updated_at,
    };
  }

  return null;
}

export async function generateMetadata({ params }: CustomPageProps) {
  const { slug } = await params;
  const page = await getPage(slug);

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
  const page = await getPage(slug);

  if (!page || !page.isPublished) {
    notFound();
  }

  return <PageLayout page={page} />;
}

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
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://sabina.education").replace(/\/+$/, "");

  if (!page || !page.isPublished) {
    return {
      title: "Page Not Found | Sabina Education",
    };
  }

  const title = page.metaTitle || `${page.title} | Sabina Education`;
  const description = page.metaDescription || `Read ${page.title} on Sabina Education.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/pages/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/pages/${slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function DynamicCustomPage({ params }: CustomPageProps) {
  const { slug } = await params;
  const page = await getPage(slug);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://sabina.education").replace(/\/+$/, "");

  if (!page || !page.isPublished) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.metaDescription,
    url: `${baseUrl}/pages/${slug}`,
    dateModified: page.updatedAt,
    publisher: {
      "@type": "EducationalOrganization",
      name: "Sabina Education",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageLayout page={page} />
    </>
  );
}

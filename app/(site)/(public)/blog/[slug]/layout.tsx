import type { Metadata } from 'next';
import React from 'react';
import { adminSupabase } from '@/src/shared/database/supabase';

interface BlogLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

async function getBlogPost(slug: string) {
  try {
    const { data } = await adminSupabase
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    return data;
  } catch (err) {
    console.error('[BlogPostLayout] Error fetching post:', err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://sabina.education').replace(/\/+$/, '');

  if (!post) {
    return {
      title: 'Article Not Found | Sabina Education Blog',
      description: 'The requested article could not be found.',
    };
  }

  const title = post.seo_title || `${post.title} | Sabina Education`;
  const description = post.seo_description || post.excerpt || `Read ${post.title} on Sabina Education.`;
  const ogImage = post.og_image || post.featured_image || `${baseUrl}/images/og-default.png`;
  const canonical = post.canonical_url || `/blog/${slug}`;

  return {
    title,
    description,
    keywords: post.seo_keywords ? post.seo_keywords.split(',').map((s: string) => s.trim()) : undefined,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `${baseUrl}/blog/${slug}`,
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at,
      authors: post.author ? [post.author] : undefined,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: post.meta_robots === 'noindex' ? { index: false, follow: false } : undefined,
  };
}

export default async function BlogPostLayout({
  children,
  params,
}: BlogLayoutProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://sabina.education').replace(/\/+$/, '');

  let jsonLd = null;
  if (post) {
    const ogImage = post.og_image || post.featured_image || `${baseUrl}/images/og-default.png`;
    const schemaType = post.schema_type || 'BlogPosting';

    jsonLd = {
      '@context': 'https://schema.org',
      '@type': schemaType,
      headline: post.title,
      description: post.seo_description || post.excerpt,
      image: ogImage,
      datePublished: post.published_at || post.created_at,
      dateModified: post.updated_at || post.published_at || post.created_at,
      author: {
        '@type': 'Person',
        name: post.author || 'Sabina Editorial Team',
        jobTitle: post.author_title || 'Education Specialist',
      },
      publisher: {
        '@type': 'EducationalOrganization',
        name: 'Sabina Education',
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/images/og-default.png`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${baseUrl}/blog/${slug}`,
      },
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}

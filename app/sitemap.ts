import type { MetadataRoute } from 'next';
import { adminSupabase } from '@/src/shared/database/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://sabina.education').replace(/\/+$/, '');
  const now = new Date();

  // 1. Static Core Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/find-tutors`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/subjects`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/become-a-tutor`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // 2. Dynamic Tutors
  let tutorRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: tutors } = await adminSupabase
      .from('tutor_profiles')
      .select('slug, updated_at')
      .is('deleted_at', null)
      .eq('verification_status', 'verified')
      .eq('account_status', 'active');

    if (tutors && tutors.length > 0) {
      tutorRoutes = tutors
        .filter((t) => Boolean(t.slug))
        .map((t) => ({
          url: `${baseUrl}/tutors/${t.slug}`,
          lastModified: t.updated_at ? new Date(t.updated_at) : now,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }));
    }
  } catch (err) {
    console.error('[sitemap] Failed fetching tutors:', err);
  }

  // 3. Dynamic Subjects
  let subjectRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: subjects } = await adminSupabase
      .from('subjects')
      .select('slug, updated_at')
      .eq('is_active', true);

    if (subjects && subjects.length > 0) {
      subjectRoutes = subjects
        .filter((s) => Boolean(s.slug))
        .map((s) => ({
          url: `${baseUrl}/subjects/${s.slug}`,
          lastModified: s.updated_at ? new Date(s.updated_at) : now,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }));
    }
  } catch (err) {
    console.error('[sitemap] Failed fetching subjects:', err);
  }

  // 4. Dynamic Blog Articles
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: blogs } = await adminSupabase
      .from('blogs')
      .select('slug, updated_at')
      .eq('is_published', true);

    if (blogs && blogs.length > 0) {
      blogRoutes = blogs
        .filter((b) => Boolean(b.slug))
        .map((b) => ({
          url: `${baseUrl}/blog/${b.slug}`,
          lastModified: b.updated_at ? new Date(b.updated_at) : now,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));
    }
  } catch (err) {
    console.error('[sitemap] Failed fetching blogs:', err);
  }

  // 5. Dynamic CMS Pages
  let pageRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: pages } = await adminSupabase
      .from('platform_pages')
      .select('slug, updated_at')
      .eq('is_published', true);

    if (pages && pages.length > 0) {
      // Exclude pages that already have dedicated top-level static routes
      const staticSlugs = new Set(['terms', 'privacy', 'refund-policy', 'cookies', 'about', 'contact', 'how-it-works', 'become-a-tutor', 'pricing']);
      pageRoutes = pages
        .filter((p) => Boolean(p.slug) && !staticSlugs.has(p.slug))
        .map((p) => ({
          url: `${baseUrl}/pages/${p.slug}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : now,
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }));
    }
  } catch (err) {
    console.error('[sitemap] Failed fetching custom pages:', err);
  }

  return [...staticRoutes, ...tutorRoutes, ...subjectRoutes, ...blogRoutes, ...pageRoutes];
}

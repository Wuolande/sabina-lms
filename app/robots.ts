import type { MetadataRoute } from 'next';
import { adminSupabase } from '@/src/shared/database/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://sabina.education').replace(/\/+$/, '');

  let allowIndexing = true;
  try {
    const { data } = await adminSupabase
      .from('platform_theme')
      .select('allow_indexing')
      .eq('id', 'default')
      .single();

    if (data && data.allow_indexing === false) {
      allowIndexing = false;
    }
  } catch {
    allowIndexing = true;
  }

  if (!allowIndexing) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
      sitemap: `${baseUrl}/sitemap.xml`,
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/student/',
          '/tutor/',
          '/admin/',
          '/api/',
          '/auth/',
          '/lessons/*/classroom',
          '/private/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/student/',
          '/tutor/',
          '/admin/',
          '/api/',
          '/auth/',
          '/lessons/*/classroom',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/student/',
          '/tutor/',
          '/admin/',
          '/api/',
          '/auth/',
          '/lessons/*/classroom',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

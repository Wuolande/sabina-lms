import type { MetadataRoute } from 'next';
import { getPlatformSeo } from '@/src/shared/seo/platformSeo';

export const dynamic = 'force-dynamic';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const seo = await getPlatformSeo().catch(() => null);
  const primaryColor = seo?.primaryColor || '#14209C';
  const title = 'Sabina';
  const description = seo?.metaDescription || 'Live 1-on-1 lessons with tutors our team has checked.';
  const iconUrl = seo?.appleTouchIconUrl || '/apple-touch-icon.png';

  return {
    name: title,
    short_name: 'Sabina',
    description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: primaryColor,
    icons: [
      {
        src: iconUrl,
        sizes: '192x192 512x512',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}

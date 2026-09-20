import type { MetadataRoute } from 'next';
import { adminSupabase } from '@/src/shared/database/supabase';

export const dynamic = 'force-dynamic';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let primaryColor = '#14209C';
  let title = 'Sabina Edge';
  let description = 'Connect with certified, elite private tutors for 1-on-1 live video lessons.';
  let iconUrl = '/apple-touch-icon.png';

  try {
    const { data } = await adminSupabase
      .from('platform_theme')
      .select('primary_color, meta_title, meta_description, favicon_url, apple_touch_icon_url')
      .eq('id', 'default')
      .single();

    if (data) {
      if (data.primary_color) primaryColor = data.primary_color;
      if (data.meta_title) title = data.meta_title.split('|')[0].trim();
      if (data.meta_description) description = data.meta_description;
      if (data.apple_touch_icon_url) {
        iconUrl = data.apple_touch_icon_url;
      } else if (data.favicon_url) {
        iconUrl = data.favicon_url;
      }
    }
  } catch {}

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

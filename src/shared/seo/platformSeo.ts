/**
 * Platform SEO & Theme Helper
 * Provides cached/server-side retrieval of platform theme colors,
 * logos, metadata, verification tokens, and crawler directives.
 */

import { adminSupabase } from '@/src/shared/database/supabase';

export interface PlatformSeoConfig {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  appleTouchIconUrl: string;
  ogImageUrl: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  googleSiteVerification: string;
  bingSiteVerification: string;
  twitterHandle: string;
  allowIndexing: boolean;
}

export const DEFAULT_PLATFORM_SEO: PlatformSeoConfig = {
  primaryColor: '#14209C',
  secondaryColor: '#F9C31C',
  logoUrl: '',
  faviconUrl: '',
  appleTouchIconUrl: '',
  ogImageUrl: '',
  metaTitle: 'Sabina Edge | Premium 1-on-1 Online Tutoring & Live Classroom',
  metaDescription: 'Connect with certified, elite private tutors for 1-on-1 live video lessons in languages, STEM, coding, and exam prep.',
  keywords: [
    'online tutoring',
    'private tutor',
    'learn languages',
    'math tutor',
    'python coding',
    'live classroom',
    'ielts prep',
  ],
  googleSiteVerification: '',
  bingSiteVerification: '',
  twitterHandle: '@SabinaLMS',
  allowIndexing: true,
};

function isValidHex(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value);
}

export async function getPlatformSeo(): Promise<PlatformSeoConfig> {
  try {
    const { data, error } = await adminSupabase
      .from('platform_theme')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error || !data) return DEFAULT_PLATFORM_SEO;

    return {
      primaryColor: isValidHex(data.primary_color) ? data.primary_color : DEFAULT_PLATFORM_SEO.primaryColor,
      secondaryColor: isValidHex(data.secondary_color) ? data.secondary_color : DEFAULT_PLATFORM_SEO.secondaryColor,
      logoUrl: typeof data.logo_url === 'string' ? data.logo_url.trim() : '',
      faviconUrl: typeof data.favicon_url === 'string' ? data.favicon_url.trim() : '',
      appleTouchIconUrl: typeof data.apple_touch_icon_url === 'string' ? data.apple_touch_icon_url.trim() : '',
      ogImageUrl: typeof data.og_image_url === 'string' ? data.og_image_url.trim() : '',
      metaTitle: typeof data.meta_title === 'string' && data.meta_title.trim() ? data.meta_title.trim() : DEFAULT_PLATFORM_SEO.metaTitle,
      metaDescription: typeof data.meta_description === 'string' && data.meta_description.trim() ? data.meta_description.trim() : DEFAULT_PLATFORM_SEO.metaDescription,
      keywords: Array.isArray(data.keywords) && data.keywords.length > 0 ? data.keywords : DEFAULT_PLATFORM_SEO.keywords,
      googleSiteVerification: typeof data.google_site_verification === 'string' ? data.google_site_verification.trim() : '',
      bingSiteVerification: typeof data.bing_site_verification === 'string' ? data.bing_site_verification.trim() : '',
      twitterHandle: typeof data.twitter_handle === 'string' && data.twitter_handle.trim() ? data.twitter_handle.trim() : DEFAULT_PLATFORM_SEO.twitterHandle,
      allowIndexing: data.allow_indexing !== undefined && data.allow_indexing !== null ? Boolean(data.allow_indexing) : true,
    };
  } catch (err) {
    console.error('[getPlatformSeo] Error fetching platform SEO:', err);
    return DEFAULT_PLATFORM_SEO;
  }
}

/**
 * API Route: GET /api/theme
 * -----------------------------------------------------------------------
 * Public endpoint — returns platform primary & secondary brand colors,
 * logo URL, favicon, apple touch icon, and SEO metadata stored in the
 * platform_theme table. Used by root layout and layouts server-side.
 * -----------------------------------------------------------------------
 */

import { NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULTS = {
  primaryColor: '#14209C',
  secondaryColor: '#F9C31C',
  logoUrl: '',
  faviconUrl: '',
  appleTouchIconUrl: '',
  ogImageUrl: '',
  metaTitle: 'Sabina Edge | Premium 1-on-1 Online Tutoring & Live Classroom',
  metaDescription: 'Connect with certified, elite private tutors for 1-on-1 live video lessons in languages, STEM, coding, and exam prep.',
  keywords: ['online tutoring', 'private tutor', 'learn languages', 'math tutor', 'python coding', 'live classroom', 'ielts prep'],
  googleSiteVerification: '',
  bingSiteVerification: '',
  twitterHandle: '@SabinaLMS',
  allowIndexing: true,
};

function isValidHex(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value);
}

function sanitizeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

export async function GET() {
  try {
    const { data, error } = await adminSupabase
      .from('platform_theme')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error || !data) {
      return NextResponse.json(DEFAULTS);
    }

    return NextResponse.json({
      primaryColor: isValidHex(data.primary_color) ? data.primary_color : DEFAULTS.primaryColor,
      secondaryColor: isValidHex(data.secondary_color) ? data.secondary_color : DEFAULTS.secondaryColor,
      logoUrl: sanitizeString(data.logo_url, DEFAULTS.logoUrl),
      faviconUrl: sanitizeString(data.favicon_url, DEFAULTS.faviconUrl),
      appleTouchIconUrl: sanitizeString(data.apple_touch_icon_url, DEFAULTS.appleTouchIconUrl),
      ogImageUrl: sanitizeString(data.og_image_url, DEFAULTS.ogImageUrl),
      metaTitle: sanitizeString(data.meta_title, DEFAULTS.metaTitle),
      metaDescription: sanitizeString(data.meta_description, DEFAULTS.metaDescription),
      keywords: Array.isArray(data.keywords) ? data.keywords : DEFAULTS.keywords,
      googleSiteVerification: sanitizeString(data.google_site_verification, DEFAULTS.googleSiteVerification),
      bingSiteVerification: sanitizeString(data.bing_site_verification, DEFAULTS.bingSiteVerification),
      twitterHandle: sanitizeString(data.twitter_handle, DEFAULTS.twitterHandle),
      allowIndexing: data.allow_indexing !== undefined && data.allow_indexing !== null ? Boolean(data.allow_indexing) : DEFAULTS.allowIndexing,
    });
  } catch {
    return NextResponse.json(DEFAULTS);
  }
}

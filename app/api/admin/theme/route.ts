/**
 * API Route: GET /api/admin/theme
 *           PUT /api/admin/theme
 * -----------------------------------------------------------------------
 * Admin endpoints to read and update the platform brand theme colors,
 * logos, and global technical SEO & asset metadata.
 * On save, calls revalidatePath across all layout segments so every panel
 * (public, admin, tutor, student) and search engine bot picks up the new
 * assets and meta tags immediately.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { adminSupabase } from '@/src/shared/database/supabase';

export const dynamic = 'force-dynamic';

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

function sanitizeKeywords(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((k): k is string => typeof k === 'string' && k.trim().length > 0)
      .map((k) => k.trim());
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }
  return DEFAULTS.keywords;
}

export async function GET() {
  try {
    const { data, error } = await adminSupabase
      .from('platform_theme')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error || !data) return NextResponse.json(DEFAULTS);

    return NextResponse.json({
      primaryColor: isValidHex(data.primary_color) ? data.primary_color : DEFAULTS.primaryColor,
      secondaryColor: isValidHex(data.secondary_color) ? data.secondary_color : DEFAULTS.secondaryColor,
      logoUrl: sanitizeString(data.logo_url, DEFAULTS.logoUrl),
      faviconUrl: sanitizeString(data.favicon_url, DEFAULTS.faviconUrl),
      appleTouchIconUrl: sanitizeString(data.apple_touch_icon_url, DEFAULTS.appleTouchIconUrl),
      ogImageUrl: sanitizeString(data.og_image_url, DEFAULTS.ogImageUrl),
      metaTitle: sanitizeString(data.meta_title, DEFAULTS.metaTitle),
      metaDescription: sanitizeString(data.meta_description, DEFAULTS.metaDescription),
      keywords: sanitizeKeywords(data.keywords),
      googleSiteVerification: sanitizeString(data.google_site_verification, DEFAULTS.googleSiteVerification),
      bingSiteVerification: sanitizeString(data.bing_site_verification, DEFAULTS.bingSiteVerification),
      twitterHandle: sanitizeString(data.twitter_handle, DEFAULTS.twitterHandle),
      allowIndexing: data.allow_indexing !== undefined && data.allow_indexing !== null ? Boolean(data.allow_indexing) : DEFAULTS.allowIndexing,
    });
  } catch {
    return NextResponse.json(DEFAULTS);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const primaryColor = isValidHex(body.primaryColor) ? body.primaryColor : DEFAULTS.primaryColor;
    const secondaryColor = isValidHex(body.secondaryColor) ? body.secondaryColor : DEFAULTS.secondaryColor;
    const logoUrl = sanitizeString(body.logoUrl, DEFAULTS.logoUrl);
    const faviconUrl = sanitizeString(body.faviconUrl, DEFAULTS.faviconUrl);
    const appleTouchIconUrl = sanitizeString(body.appleTouchIconUrl, DEFAULTS.appleTouchIconUrl);
    const ogImageUrl = sanitizeString(body.ogImageUrl, DEFAULTS.ogImageUrl);
    const metaTitle = sanitizeString(body.metaTitle, DEFAULTS.metaTitle);
    const metaDescription = sanitizeString(body.metaDescription, DEFAULTS.metaDescription);
    const keywords = sanitizeKeywords(body.keywords);
    const googleSiteVerification = sanitizeString(body.googleSiteVerification, DEFAULTS.googleSiteVerification);
    const bingSiteVerification = sanitizeString(body.bingSiteVerification, DEFAULTS.bingSiteVerification);
    const twitterHandle = sanitizeString(body.twitterHandle, DEFAULTS.twitterHandle);
    const allowIndexing = body.allowIndexing !== undefined ? Boolean(body.allowIndexing) : DEFAULTS.allowIndexing;

    const payload = {
      id: 'default',
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      logo_url: logoUrl,
      favicon_url: faviconUrl,
      apple_touch_icon_url: appleTouchIconUrl,
      og_image_url: ogImageUrl,
      meta_title: metaTitle,
      meta_description: metaDescription,
      keywords: keywords,
      google_site_verification: googleSiteVerification,
      bing_site_verification: bingSiteVerification,
      twitter_handle: twitterHandle,
      allow_indexing: allowIndexing,
      updated_at: new Date().toISOString(),
    };

    const { error } = await adminSupabase
      .from('platform_theme')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw new Error(error.message);

    // Bust ISR cache for ALL layout segments and public pages so new colors, logos, and SEO propagate immediately
    try {
      revalidateTag('platform-theme');
    } catch {}
    revalidatePath('/', 'layout');
    revalidatePath('/', 'page');
    revalidatePath('/(public)', 'layout');
    revalidatePath('/admin', 'layout');
    revalidatePath('/student', 'layout');
    revalidatePath('/tutor', 'layout');
    revalidatePath('/sitemap.xml');
    revalidatePath('/robots.txt');

    return NextResponse.json({
      success: true,
      primaryColor,
      secondaryColor,
      logoUrl,
      faviconUrl,
      appleTouchIconUrl,
      ogImageUrl,
      metaTitle,
      metaDescription,
      keywords,
      googleSiteVerification,
      bingSiteVerification,
      twitterHandle,
      allowIndexing,
    });
  } catch (err: any) {
    console.error('[PUT /api/admin/theme]', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

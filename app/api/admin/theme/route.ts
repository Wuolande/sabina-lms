/**
 * API Route: GET /api/admin/theme
 *           PUT /api/admin/theme
 * -----------------------------------------------------------------------
 * Admin endpoints to read and update the platform brand theme colors and logo.
 * On save, calls revalidatePath across all layout segments so every panel
 * (public, admin, tutor, student) picks up the new colors and logo on next request.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { adminSupabase } from '@/src/shared/database/supabase';

const DEFAULTS = {
  primaryColor: '#14209C',
  secondaryColor: '#F9C31C',
  logoUrl: '',
};

function isValidHex(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value);
}

export async function GET() {
  try {
    const { data, error } = await adminSupabase
      .from('platform_theme')
      .select('primary_color, secondary_color, logo_url')
      .eq('id', 'default')
      .single();

    if (error || !data) return NextResponse.json(DEFAULTS);

    return NextResponse.json({
      primaryColor:   isValidHex(data.primary_color)   ? data.primary_color   : DEFAULTS.primaryColor,
      secondaryColor: isValidHex(data.secondary_color) ? data.secondary_color : DEFAULTS.secondaryColor,
      logoUrl:        typeof data.logo_url === 'string' ? data.logo_url.trim() : DEFAULTS.logoUrl,
    });
  } catch {
    return NextResponse.json(DEFAULTS);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const primaryColor   = isValidHex(body.primaryColor)   ? body.primaryColor   : DEFAULTS.primaryColor;
    const secondaryColor = isValidHex(body.secondaryColor) ? body.secondaryColor : DEFAULTS.secondaryColor;
    const logoUrl        = typeof body.logoUrl === 'string' ? body.logoUrl.trim() : DEFAULTS.logoUrl;

    const { error } = await adminSupabase
      .from('platform_theme')
      .upsert(
        {
          id: 'default',
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          logo_url: logoUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) throw new Error(error.message);

    // Bust ISR cache for ALL layout segments so new colors and logo propagate immediately
    revalidatePath('/', 'layout');
    revalidatePath('/admin', 'layout');
    revalidatePath('/student', 'layout');
    revalidatePath('/tutor', 'layout');

    return NextResponse.json({ success: true, primaryColor, secondaryColor, logoUrl });
  } catch (err: any) {
    console.error('[PUT /api/admin/theme]', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

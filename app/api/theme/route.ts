/**
 * API Route: GET /api/theme
 * -----------------------------------------------------------------------
 * Public endpoint — returns platform primary & secondary brand colors
 * and logo URL stored in the platform_theme table. Used by the root
 * layout to inject CSS custom properties and logo context server-side.
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

    if (error || !data) {
      return NextResponse.json(DEFAULTS);
    }

    return NextResponse.json({
      primaryColor:   isValidHex(data.primary_color)   ? data.primary_color   : DEFAULTS.primaryColor,
      secondaryColor: isValidHex(data.secondary_color) ? data.secondary_color : DEFAULTS.secondaryColor,
      logoUrl:        typeof data.logo_url === 'string' ? data.logo_url.trim() : DEFAULTS.logoUrl,
    });
  } catch {
    return NextResponse.json(DEFAULTS);
  }
}

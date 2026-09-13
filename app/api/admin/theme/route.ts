/**
 * API Route: GET /api/admin/theme
 *           PUT /api/admin/theme
 * -----------------------------------------------------------------------
 * Admin endpoints to read and update the platform brand theme colors.
 * On save, calls revalidatePath across all layout segments so every panel
 * (public, admin, tutor, student) picks up the new colors on next request.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { adminSupabase } from '@/src/shared/database/supabase';

const DEFAULTS = {
  primaryColor: '#14209C',
  secondaryColor: '#F9C31C',
};

function isValidHex(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value);
}

export async function GET() {
  try {
    const { data, error } = await adminSupabase
      .from('platform_theme')
      .select('primary_color, secondary_color')
      .eq('id', 'default')
      .single();

    if (error || !data) return NextResponse.json(DEFAULTS);

    return NextResponse.json({
      primaryColor:   isValidHex(data.primary_color)   ? data.primary_color   : DEFAULTS.primaryColor,
      secondaryColor: isValidHex(data.secondary_color) ? data.secondary_color : DEFAULTS.secondaryColor,
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

    const { error } = await adminSupabase
      .from('platform_theme')
      .upsert(
        {
          id: 'default',
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) throw new Error(error.message);

    // Bust ISR cache for ALL layout segments so new colors propagate immediately
    revalidatePath('/', 'layout');
    revalidatePath('/admin', 'layout');
    revalidatePath('/student', 'layout');
    revalidatePath('/tutor', 'layout');

    return NextResponse.json({ success: true, primaryColor, secondaryColor });
  } catch (err: any) {
    console.error('[PUT /api/admin/theme]', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

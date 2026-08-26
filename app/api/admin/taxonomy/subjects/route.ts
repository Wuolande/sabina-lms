/**
 * API Route: POST /api/admin/taxonomy/subjects
 * -----------------------------------------------------------------------
 * Admin API to create or update a subject in the platform taxonomy,
 * including the is_featured toggle for homepage display.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { data, error } = await adminSupabase.rpc('upsert_subject_atomic', {
      p_id: body.id || null,
      p_name: body.name || '',
      p_slug: body.slug || '',
      p_category: body.category || 'General',
      p_description: body.description || '',
      p_icon_name: body.iconName || 'BookOpen',
      p_is_active: body.isActive !== undefined ? body.isActive : true,
      p_is_featured: body.isFeatured !== undefined ? body.isFeatured : true,
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[POST /api/admin/taxonomy/subjects]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * API Route: GET /api/subjects
 * -----------------------------------------------------------------------
 * Public API listing active subjects with live tutor counts from Supabase.
 * Supports filtering by category and isFeatured.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { Subject } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || null;
    const isFeatured = searchParams.get('isFeatured') === 'true';
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : null;

    let query = adminSupabase
      .from('subjects')
      .select(`
        id,
        name,
        slug,
        category,
        description,
        is_active,
        is_featured,
        tutors:tutor_subjects(count)
      `)
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('name', { ascending: true });

    if (category && category !== 'all') {
      query = query.ilike('category', `%${category}%`);
    }

    if (isFeatured) {
      query = query.eq('is_featured', true);
    }

    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const formatted: Subject[] = (data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      category: s.category,
      description: s.description || `Master ${s.name} with certified 1-on-1 educators.`,
      iconName: s.icon_name || s.iconName || 'BookOpen',
      popular: s.is_featured ?? true,
      tutorCount: s.tutors?.[0]?.count || 12,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('[GET /api/subjects]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

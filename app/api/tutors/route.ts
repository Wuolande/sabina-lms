/**
 * API Route: GET /api/tutors
 * -----------------------------------------------------------------------
 * Public marketplace API to list and search verified active tutors
 * directly from the live Supabase database using get_marketplace_tutors.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('query') || searchParams.get('q') || null;
    const category = searchParams.get('subjectGroup') || searchParams.get('group') || null;
    const subject = searchParams.get('subject') || null;
    const country = searchParams.get('country') || null;
    const language = searchParams.get('language') || null;
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null;
    const rating = searchParams.get('rating') ? Number(searchParams.get('rating')) : null;
    const isFeatured = searchParams.get('isFeatured') === 'true' ? true : null;
    const isSuperTutor = searchParams.get('isSuperTutor') === 'true' || searchParams.get('superTutorOnly') === 'true' ? true : null;
    const sortBy = searchParams.get('sortBy') || searchParams.get('sort') || 'popularity';
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 10)));
    const offset = (page - 1) * limit;

    const { data, error } = await adminSupabase.rpc('get_marketplace_tutors', {
      p_search: search,
      p_category: category,
      p_subject: subject,
      p_country: country,
      p_language: language,
      p_min_price: minPrice,
      p_max_price: maxPrice,
      p_rating: rating,
      p_is_featured: isFeatured,
      p_is_super_tutor: isSuperTutor,
      p_sort_by: sortBy,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      throw new Error(`[GET /api/tutors] ${error.message}`);
    }

    return NextResponse.json({
      tutors: data?.tutors || [],
      total: data?.total || 0,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('[GET /api/tutors]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

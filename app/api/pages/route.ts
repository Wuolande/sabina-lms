/**
 * API Route: GET /api/pages
 * -----------------------------------------------------------------------
 * Public API listing published platform pages.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || null;
    const search = searchParams.get('search') || null;

    const { data, error } = await adminSupabase.rpc('list_cms_pages', {
      p_category: category,
      p_search: search,
    });

    if (error) {
      throw new Error(error.message);
    }

    const published = (data || []).filter((p: any) => p.isPublished);
    return NextResponse.json(published);
  } catch (error: any) {
    console.error('[GET /api/pages]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

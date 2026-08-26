/**
 * API Route: GET /api/pages/[slug]
 * -----------------------------------------------------------------------
 * Public API returning CMS page content by slug.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { data, error } = await adminSupabase.rpc('get_cms_page_by_slug', {
      p_slug: slug.toLowerCase(),
    });

    if (error || !data) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    if (!data.isPublished) {
      return NextResponse.json({ error: 'Page is not published' }, { status: 403 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[GET /api/pages/[slug]]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

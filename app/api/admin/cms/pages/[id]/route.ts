/**
 * API Route: GET    /api/admin/cms/pages/[id]
 *           DELETE /api/admin/cms/pages/[id]
 * -----------------------------------------------------------------------
 * Admin endpoints to fetch single page by slug/id or delete custom page.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { getAdminContext } from '@/src/shared/auth/authService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAdminContext(req);
    const { id } = await params;

    // Check if id is slug or UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = adminSupabase.from('platform_pages').select('*');
    if (isUuid) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id.toLowerCase());
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      slug: data.slug,
      title: data.title,
      category: data.category,
      metaTitle: data.meta_title,
      metaDescription: data.meta_description,
      contentHtml: data.content_html,
      contentJson: data.content_json,
      isPublished: data.is_published,
      readingTimeMinutes: data.reading_time_minutes,
      lastReviewedAt: data.last_reviewed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error: any) {
    console.error('[GET /api/admin/cms/pages/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminContext(req);
    const { id } = await params;

    const { data, error } = await adminSupabase.rpc('delete_cms_page', {
      p_page_id: id,
      p_admin_id: admin.id,
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: data });
  } catch (error: any) {
    console.error('[DELETE /api/admin/cms/pages/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

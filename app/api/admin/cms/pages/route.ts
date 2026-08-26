/**
 * API Route: GET  /api/admin/cms/pages
 *           POST /api/admin/cms/pages
 * -----------------------------------------------------------------------
 * Admin endpoints to list and upsert CMS pages with database fallback.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { getAdminContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || null;
    const search = searchParams.get('search') || null;

    // 1. Try RPC
    try {
      const { data, error } = await adminSupabase.rpc('list_cms_pages', {
        p_category: category,
        p_search: search,
      });

      if (!error && data && data.length > 0) {
        return NextResponse.json(data);
      }
    } catch {
      // Fallback to table query
    }

    // 2. Direct table fallback
    let query = adminSupabase
      .from('platform_pages')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: rows, error: tblError } = await query;

    if (rows && rows.length > 0) {
      return NextResponse.json(
        rows.map((p: any) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          category: p.category,
          metaTitle: p.meta_title,
          metaDescription: p.meta_description,
          contentHtml: p.content_html,
          isPublished: p.is_published,
          readingTimeMinutes: p.reading_time_minutes,
          lastReviewedAt: p.last_reviewed_at,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }))
      );
    }

    return NextResponse.json([]);
  } catch (error: any) {
    console.error('[GET /api/admin/cms/pages]', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Try RPC
    try {
      const { data, error } = await adminSupabase.rpc('upsert_cms_page', {
        p_page: body,
      });

      if (!error && data) {
        return NextResponse.json(data);
      }
    } catch {
      // Fallback to direct table upsert
    }

    // 2. Direct table upsert fallback
    const { data: saved, error: insErr } = await adminSupabase
      .from('platform_pages')
      .upsert(
        {
          slug: body.slug,
          title: body.title,
          category: body.category || 'custom',
          meta_title: body.metaTitle || body.title,
          meta_description: body.metaDescription || '',
          content_html: body.contentHtml || '',
          is_published: body.isPublished ?? true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'slug' }
      )
      .select()
      .single();

    if (saved) {
      return NextResponse.json({
        id: saved.id,
        slug: saved.slug,
        title: saved.title,
        category: saved.category,
        metaTitle: saved.meta_title,
        metaDescription: saved.meta_description,
        contentHtml: saved.content_html,
        isPublished: saved.is_published,
        updatedAt: saved.updated_at,
      });
    }

    return NextResponse.json({
      id: `page-${Date.now()}`,
      ...body,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[POST /api/admin/cms/pages]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

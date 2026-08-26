/**
 * API Route: GET  /api/admin/cms/pages
 *           POST /api/admin/cms/pages
 * -----------------------------------------------------------------------
 * Admin endpoints to list and upsert CMS pages.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { getAdminContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    await getAdminContext(req);
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

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[GET /api/admin/cms/pages]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminContext(req);
    const body = await req.json();

    const { data, error } = await adminSupabase.rpc('upsert_cms_page', {
      p_page: body,
      p_admin_id: admin.id,
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[POST /api/admin/cms/pages]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

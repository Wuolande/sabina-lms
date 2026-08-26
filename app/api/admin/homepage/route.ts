/**
 * API Route: GET /api/admin/homepage
 *           PUT /api/admin/homepage
 * -----------------------------------------------------------------------
 * Admin CMS endpoints to read and update homepage content atomically.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { getAdminContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    await getAdminContext(req);
    const { data, error } = await adminSupabase.rpc('get_homepage_content');

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[GET /api/admin/homepage]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await getAdminContext(req);
    const body = await req.json();

    const { data, error } = await adminSupabase.rpc('update_homepage_content', {
      p_content: body,
      p_admin_id: admin.id,
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[PUT /api/admin/homepage]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

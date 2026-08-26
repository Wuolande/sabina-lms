/**
 * API Route: POST /api/admin/taxonomy/timezones
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { data, error } = await adminSupabase.rpc('upsert_timezone_atomic', {
      p_id: body.id || null,
      p_identifier: body.identifier || '',
      p_display_name: body.displayName || '',
      p_utc_offset: body.utcOffset || 'UTC+00:00',
      p_region: body.region || 'Global',
      p_is_active: body.isActive !== undefined ? body.isActive : true,
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[POST /api/admin/taxonomy/timezones]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

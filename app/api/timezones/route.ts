/**
 * API Route: GET /api/timezones
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await adminSupabase
      .from('timezones')
      .select('id, identifier, display_name, utc_offset, region, is_active')
      .eq('is_active', true)
      .order('utc_offset', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('[GET /api/timezones]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

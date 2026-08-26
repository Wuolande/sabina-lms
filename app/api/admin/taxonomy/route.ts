/**
 * API Route: GET /api/admin/taxonomy
 * -----------------------------------------------------------------------
 * Admin API to retrieve the complete 360° platform taxonomy aggregate
 * (Subjects, Languages, Countries, Timezones, Currencies, and Policies).
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await adminSupabase.rpc('get_platform_taxonomy_360');

    if (error) {
      throw new Error(`[GET /api/admin/taxonomy] ${error.message}`);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[GET /api/admin/taxonomy]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

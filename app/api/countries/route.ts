/**
 * API Route: GET /api/countries
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await adminSupabase
      .from('countries')
      .select('id, code, name, dial_code, currency_code, continent, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('[GET /api/countries]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

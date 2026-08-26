/**
 * API Route: POST /api/admin/taxonomy/countries
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { data, error } = await adminSupabase.rpc('upsert_country_atomic', {
      p_id: body.id || null,
      p_code: body.code || '',
      p_name: body.name || '',
      p_dial_code: body.dialCode || '',
      p_currency_code: body.currencyCode || 'USD',
      p_continent: body.continent || 'Global',
      p_is_active: body.isActive !== undefined ? body.isActive : true,
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[POST /api/admin/taxonomy/countries]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

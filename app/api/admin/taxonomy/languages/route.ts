/**
 * API Route: POST /api/admin/taxonomy/languages
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { data, error } = await adminSupabase.rpc('upsert_language_atomic', {
      p_id: body.id || null,
      p_name: body.name || '',
      p_code: body.code || '',
      p_native_name: body.nativeName || '',
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[POST /api/admin/taxonomy/languages]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

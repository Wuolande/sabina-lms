/**
 * API Route: GET /api/languages
 * -----------------------------------------------------------------------
 * Public API listing supported languages from Supabase.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { Language } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await adminSupabase
      .from('languages')
      .select('id, name, code, native_name')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const formatted: Language[] = (data || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      code: l.code,
      nativeName: l.native_name || l.name,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('[GET /api/languages]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

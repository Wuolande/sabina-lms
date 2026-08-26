/**
 * API Route: DELETE /api/admin/taxonomy/timezones/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await adminSupabase.rpc('delete_timezone_atomic', {
      p_id: id,
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[DELETE /api/admin/taxonomy/timezones/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

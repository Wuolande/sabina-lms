/**
 * API Route: POST /api/classroom/no-show
 * -----------------------------------------------------------------------
 * Resolves student or tutor no-show scenarios adhering to the global
 * 15-minute attendance waiting rule (Preply/Italki benchmark).
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { z } from 'zod';

const NoShowSchema = z.object({
  lessonId: z.string().uuid(),
  role: z.enum(['TUTOR', 'STUDENT']),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = NoShowSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { lessonId, role, reason } = parsed.data;

    // Call atomic stored procedure
    const { data, error } = await adminSupabase.rpc('resolve_no_show_atomic', {
      p_lesson_id: lessonId,
      p_reported_by_role: role,
      p_reason: reason || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data?.success) {
      return NextResponse.json(
        { error: data?.error || 'Unable to resolve no-show.' },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[POST /api/classroom/no-show]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

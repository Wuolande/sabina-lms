/**
 * API Route: POST /api/classroom/start
 * -----------------------------------------------------------------------
 * Atomically stamps the actual_start timestamp and marks the lesson as LIVE
 * when a participant joins the classroom.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { z } from 'zod';

const StartLessonSchema = z.object({
  lessonId: z.string().uuid(),
  role: z.enum(['TUTOR', 'STUDENT']).optional().default('STUDENT'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = StartLessonSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { lessonId, role } = parsed.data;

    const { data, error } = await adminSupabase.rpc('mark_lesson_started_atomic', {
      p_lesson_id: lessonId,
      p_participant_role: role,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[POST /api/classroom/start]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

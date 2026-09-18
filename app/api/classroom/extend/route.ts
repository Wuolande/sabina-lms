/**
 * API Route: POST /api/classroom/extend
 * -----------------------------------------------------------------------
 * Allows an authorized tutor to extend an ongoing lesson (+5, +10, +15m)
 * provided there is no conflicting future booking for the tutor.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { z } from 'zod';

const ExtendLessonSchema = z.object({
  lessonId: z.string().uuid(),
  additionalMinutes: z.number().int().refine((val) => [5, 10, 15, 20, 30].includes(val), {
    message: 'Allowed extension intervals: 5, 10, 15, 20, or 30 minutes.',
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = ExtendLessonSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { lessonId, additionalMinutes } = parsed.data;

    // Execute atomic extension with overlap validation
    const { data, error } = await adminSupabase.rpc('extend_lesson_atomic', {
      p_lesson_id: lessonId,
      p_additional_minutes: additionalMinutes,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data?.success) {
      return NextResponse.json(
        { error: data?.error || 'Unable to extend lesson.' },
        { status: 409 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[POST /api/classroom/extend]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

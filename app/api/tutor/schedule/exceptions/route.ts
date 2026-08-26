/**
 * API Route: GET /api/tutor/schedule/exceptions
 *           POST /api/tutor/schedule/exceptions
 * -----------------------------------------------------------------------
 * GET  — Returns tutor's vacation and time-off exception dates.
 * POST — Adds a date-specific block / vacation override.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { getTutorContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const ExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  isBlocked: z.boolean().default(true),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  reason: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const schedule = await domainLessonService.getTutorSchedule360(tutor.tutorProfileId);
    return NextResponse.json(schedule.exceptions || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const body = await req.json();
    const parsed = ExceptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid exception date' }, { status: 400 });
    }

    const result = await domainLessonService.addTimeOffException(tutor.tutorProfileId, parsed.data);
    return NextResponse.json({ success: true, exception: result }, { status: 201 });

  } catch (error: any) {
    console.error('[POST /api/tutor/schedule/exceptions]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

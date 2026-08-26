/**
 * API Route: GET /api/tutor/availability
 *           PUT /api/tutor/availability
 * -----------------------------------------------------------------------
 * GET — Returns weekly recurring availability rules for logged-in tutor.
 * PUT — Saves weekly recurring schedule matrix to database.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { getTutorContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const RulesSchema = z.object({
  rules: z.array(
    z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string(),
      endTime: z.string(),
      isActive: z.boolean(),
    })
  ),
});

export async function GET(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const rules = await domainLessonService.getTutorAvailability(tutor.tutorProfileId);
    return NextResponse.json(rules);
  } catch (error: any) {
    console.error('[GET /api/tutor/availability]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const body = await req.json();
    const parsed = RulesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid availability format' }, { status: 400 });
    }

    await domainLessonService.saveTutorAvailability(tutor.tutorProfileId, parsed.data.rules);
    return NextResponse.json({ success: true, message: 'Availability rules saved.' });

  } catch (error: any) {
    console.error('[PUT /api/tutor/availability]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

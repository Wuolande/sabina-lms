/**
 * API Route: PUT /api/tutor/schedule/settings
 * -----------------------------------------------------------------------
 * Updates buffer minutes, minimum notice hours, max advance booking days.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { getTutorContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const SettingsSchema = z.object({
  bufferMinutes: z.number().refine((n) => [0, 5, 10, 15, 30].includes(n), {
    message: 'Buffer minutes must be 0, 5, 10, 15, or 30.',
  }).optional(),
  minNoticeHours: z.number().refine((n) => [1, 2, 4, 12, 24, 48].includes(n), {
    message: 'Min notice hours must be 1, 2, 4, 12, 24, or 48.',
  }).optional(),
  maxAdvanceDays: z.number().refine((n) => [7, 14, 30, 60, 90].includes(n), {
    message: 'Max advance days must be 7, 14, 30, 60, or 90.',
  }).optional(),
  defaultLessonDuration: z.number().refine((n) => [25, 50, 75, 80].includes(n), {
    message: 'Default duration must be 25, 50, 75, or 80.',
  }).optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const body = await req.json();
    const parsed = SettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid settings parameters', details: parsed.error.format() }, { status: 400 });
    }

    await domainLessonService.saveScheduleSettings(tutor.tutorProfileId, parsed.data);
    return NextResponse.json({ success: true, message: 'Schedule policy settings saved.' });

  } catch (error: any) {
    console.error('[PUT /api/tutor/schedule/settings]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

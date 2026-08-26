/**
 * API Route: GET /api/tutor/schedule
 * -----------------------------------------------------------------------
 * Returns the full schedule 360 aggregate for the tutor (settings, weekly rules,
 * time-off exceptions, and upcoming live/scheduled lessons).
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const schedule360 = await domainLessonService.getTutorSchedule360(tutor.tutorProfileId);
    return NextResponse.json(schedule360);
  } catch (error: any) {
    console.error('[GET /api/tutor/schedule]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

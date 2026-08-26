/**
 * API Route: GET /api/tutor/lessons
 * -----------------------------------------------------------------------
 * Returns scheduled, live, and completed classes for the logged-in tutor.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;

    const lessons = await domainLessonService.getTutorLessons(tutor.tutorProfileId, status);
    return NextResponse.json(lessons);

  } catch (error: any) {
    console.error('[GET /api/tutor/lessons]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

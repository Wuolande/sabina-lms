/**
 * API Route: GET /api/tutor/reviews
 * -----------------------------------------------------------------------
 * Returns aggregate stats, star distribution, and verified student reviews.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const data = await domainLessonService.getTutorReviews360(tutor.tutorProfileId);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[GET /api/tutor/reviews]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

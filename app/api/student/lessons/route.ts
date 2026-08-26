/**
 * API Route: GET /api/student/lessons
 * -----------------------------------------------------------------------
 * Returns rich synchronized student lessons with curriculum, homework,
 * materials, and tutor review replies.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { getStudentContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const lessons = await domainLessonService.getStudentLessonsList(student.userId);
    return NextResponse.json(lessons);

  } catch (error: any) {
    console.error('[GET /api/student/lessons]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

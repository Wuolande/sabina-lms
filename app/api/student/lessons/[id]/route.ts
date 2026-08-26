/**
 * API Route: GET /api/student/lessons/[id]
 * -----------------------------------------------------------------------
 * Returns full student lesson 360 aggregate with tutor profile, curriculum,
 * homework, worksheets, review & tutor reply.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { getStudentContext } from '@/src/shared/auth/authService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = await getStudentContext(req);

    const lesson = await domainLessonService.getStudentLesson360(id, student.userId);
    return NextResponse.json(lesson);

  } catch (error: any) {
    console.error('[GET /api/student/lessons/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

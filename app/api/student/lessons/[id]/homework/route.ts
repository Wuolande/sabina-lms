/**
 * API Route: POST /api/student/lessons/[id]/homework
 * -----------------------------------------------------------------------
 * Submit homework response notes from student to tutor.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { getStudentContext } from '@/src/shared/auth/authService';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = await getStudentContext(req);
    const body = await req.json();

    const result = await domainLessonService.submitStudentHomeworkNotes(
      id,
      student.userId,
      body.notes || ''
    );

    return NextResponse.json({ success: true, lesson: result });

  } catch (error: any) {
    console.error('[POST /api/student/lessons/[id]/homework]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * API Route: GET /api/tutor/students/[id]
 * -----------------------------------------------------------------------
 * Returns full Student 360 profile for tutor inspection (goals, lesson history,
 * private notes, roadmap, and shared worksheets).
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainStudentService } from '@/src/modules/students/services/studentService';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tutor = await getTutorContext(req);

    const student360 = await domainStudentService.getTutorStudent360(tutor.tutorProfileId, id);
    return NextResponse.json(student360);

  } catch (error: any) {
    console.error('[GET /api/tutor/students/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

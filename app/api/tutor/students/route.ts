/**
 * API Route: GET /api/tutor/students
 * -----------------------------------------------------------------------
 * Returns the roster of students enrolled with the logged-in tutor.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainStudentService } from '@/src/modules/students/services/studentService';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const students = await domainStudentService.getStudentsForTutor(tutor.tutorProfileId);
    return NextResponse.json(students);

  } catch (error: any) {
    console.error('[GET /api/tutor/students]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

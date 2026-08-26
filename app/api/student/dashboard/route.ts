/**
 * API Route: GET /api/student/dashboard
 * -----------------------------------------------------------------------
 * Returns complete Student Dashboard 360 executive aggregate:
 *  - Student User & Profile
 *  - Executive Stats (Hours, Lessons, Streak, Goals, Pace)
 *  - Next Live Class Spotlight
 *  - Upcoming Lessons Queue
 *  - Recent Completed Sessions with Homework & Review Status
 *  - Active Learning Goals
 *  - Enrolled Tutors Roster
 *  - Recent Worksheets & Materials
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainStudentService } from '@/src/modules/students/services/studentService';
import { getStudentContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const data = await domainStudentService.getStudentDashboard360(student.userId);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[GET /api/student/dashboard]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

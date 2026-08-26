/**
 * API Route: GET /api/student/settings
 *           PUT /api/student/settings
 * -----------------------------------------------------------------------
 * GET — Returns full student settings 360 aggregate.
 * PUT — Updates student user profile, learning preferences, notification
 *       preferences, and privacy settings atomically.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainStudentService } from '@/src/modules/students/services/studentService';
import { getStudentContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const data = await domainStudentService.getStudentSettings360(student.userId);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[GET /api/student/settings]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const body = await req.json();

    const data = await domainStudentService.updateStudentSettingsAtomic(student.userId, body);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[PUT /api/student/settings]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

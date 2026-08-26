/**
 * API Route: POST /api/student/settings/deactivate
 * -----------------------------------------------------------------------
 * Deactivates student account temporarily.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainStudentService } from '@/src/modules/students/services/studentService';
import { getStudentContext } from '@/src/shared/auth/authService';

export async function POST(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const body = await req.json();

    const data = await domainStudentService.deactivateStudentAccount(
      student.userId,
      body.reason || 'User requested temporary pause.'
    );

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('[POST /api/student/settings/deactivate]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

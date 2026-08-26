/**
 * API Route: POST /api/student/settings/delete-account
 * -----------------------------------------------------------------------
 * Permanently deletes & anonymizes student account under GDPR Right to Erasure.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainStudentService } from '@/src/modules/students/services/studentService';
import { getStudentContext } from '@/src/shared/auth/authService';

export async function POST(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const body = await req.json();

    if (!body.confirmation || body.confirmation.toUpperCase() !== `DELETE ${student.displayName.toUpperCase()}`) {
      return NextResponse.json(
        { error: 'Invalid confirmation phrase. Please type DELETE followed by your full name.' },
        { status: 400 }
      );
    }

    await domainStudentService.deleteStudentAccountGdpr(student.userId);
    return NextResponse.json({ success: true, message: 'Account permanently erased.' });

  } catch (error: any) {
    console.error('[POST /api/student/settings/delete-account]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

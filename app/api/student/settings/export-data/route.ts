/**
 * API Route: GET /api/student/settings/export-data
 * -----------------------------------------------------------------------
 * Generates and downloads full student GDPR data portability JSON archive.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainStudentService } from '@/src/modules/students/services/studentService';
import { getStudentContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const data = await domainStudentService.exportStudentGdprData(student.userId);

    const jsonString = JSON.stringify(data, null, 2);

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="sabina-student-data-${student.displayName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json"`,
      },
    });

  } catch (error: any) {
    console.error('[GET /api/student/settings/export-data]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

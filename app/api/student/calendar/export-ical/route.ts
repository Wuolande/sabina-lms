/**
 * API Route: GET /api/student/calendar/export-ical
 * -----------------------------------------------------------------------
 * Generates and downloads a standard RFC 5545 iCalendar (.ics) feed of all
 * student scheduled learning sessions for Google Calendar, Apple Calendar,
 * and Microsoft Outlook.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { getStudentContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const icsContent = await domainLessonService.generateStudentIcsFeed(student.userId);

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="sabina-student-schedule-${student.userId}.ics"`,
      },
    });

  } catch (error: any) {
    console.error('[GET /api/student/calendar/export-ical]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

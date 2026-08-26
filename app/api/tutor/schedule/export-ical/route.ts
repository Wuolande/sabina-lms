/**
 * API Route: GET /api/tutor/schedule/export-ical
 * -----------------------------------------------------------------------
 * Generates and downloads a standard RFC 5545 iCalendar (.ics) feed of all
 * scheduled teaching sessions for Google Calendar, Apple Calendar, and Outlook.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const icsContent = await domainLessonService.generateIcsFeed(tutor.tutorProfileId);

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="sabina-schedule-${tutor.tutorProfileId}.ics"`,
      },
    });

  } catch (error: any) {
    console.error('[GET /api/tutor/schedule/export-ical]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

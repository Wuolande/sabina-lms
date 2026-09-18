/**
 * API Route: GET /api/tutors/[slug]/slots
 * -----------------------------------------------------------------------
 * Public endpoint to fetch live, bookable slots for a tutor on a target date,
 * accurately converted to the student's / viewer's timezone.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { tutorService } from '@/src/modules/tutors/services/tutorService';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { generateCrossTimezoneSlots } from '@/src/shared/utils/timezone';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);

    const studentDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const studentTz = searchParams.get('tz') || 'UTC';
    const durationMinutes = parseInt(searchParams.get('duration') || '50', 10);

    // 1. Fetch tutor profile
    const tutor = await tutorService.getPublicProfile(slug);
    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
    }

    const tutorProfileId = tutor.id;
    const tutorTz = tutor.user?.timezone || 'UTC';

    // 2. Fetch tutor schedule aggregate (rules, exceptions, settings, booked lessons)
    const schedule = await domainLessonService.getTutorSchedule360(tutorProfileId);

    const rules = schedule?.rules || [];
    const exceptions = schedule?.exceptions || [];
    const bookedLessons = schedule?.upcomingLessons || [];
    const bufferMinutes = schedule?.settings?.bufferMinutes ?? 10;
    const minNoticeHours = schedule?.settings?.minNoticeHours ?? 2;

    // 3. Generate cross-timezone slots
    const slots = generateCrossTimezoneSlots({
      studentDate,
      studentTz,
      tutorTz,
      rules,
      exceptions,
      bookedLessons,
      durationMinutes,
      bufferMinutes,
      minNoticeHours,
    });

    return NextResponse.json({
      date: studentDate,
      timezone: studentTz,
      tutorTimezone: tutorTz,
      durationMinutes,
      slots,
    });

  } catch (error: any) {
    console.error('[GET /api/tutors/[slug]/slots]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

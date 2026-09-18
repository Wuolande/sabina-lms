/**
 * API Route: GET /api/tutor/schedule/preview
 * -----------------------------------------------------------------------
 * Calculates live bookable slots for a tutor on a given date and timezone,
 * accounting for weekly multi-slots, existing bookings, exceptions, and buffers.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { getTutorContext } from '@/src/shared/auth/authService';
import { adminSupabase } from '@/src/shared/database/supabase';
import { generateCrossTimezoneSlots } from '@/src/shared/utils/timezone';

export async function GET(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const { searchParams } = new URL(req.url);
    const targetDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const targetTz = searchParams.get('tz') || 'UTC';

    // Fetch tutor's configured timezone
    const { data: userData } = await adminSupabase
      .from('users')
      .select('timezone')
      .eq('id', tutor.userId)
      .single();

    const tutorTz = userData?.timezone || 'UTC';

    const schedule = await domainLessonService.getTutorSchedule360(tutor.tutorProfileId);

    // Check if whole day is blocked in tutor's local calendar
    const isBlocked = (schedule.exceptions || []).some(
      (ex: any) => ex.date === targetDate && ex.isBlocked && !ex.startTime
    );

    const duration = schedule.settings?.defaultLessonDuration || 50;
    const buffer = schedule.settings?.bufferMinutes || 10;

    const slots = generateCrossTimezoneSlots({
      studentDate: targetDate,
      studentTz: targetTz,
      tutorTz,
      rules: schedule.rules || [],
      exceptions: schedule.exceptions || [],
      bookedLessons: schedule.upcomingLessons || [],
      durationMinutes: duration,
      bufferMinutes: buffer,
      minNoticeHours: 0, // In simulation mode, show all generated slots
    });

    return NextResponse.json({
      date: targetDate,
      timezone: targetTz,
      tutorTimezone: tutorTz,
      isBlocked,
      slots,
    });

  } catch (error: any) {
    console.error('[GET /api/tutor/schedule/preview]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

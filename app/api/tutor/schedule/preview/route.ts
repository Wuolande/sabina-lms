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

export async function GET(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const { searchParams } = new URL(req.url);
    const targetDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const targetTz = searchParams.get('tz') || 'UTC';

    const schedule = await domainLessonService.getTutorSchedule360(tutor.tutorProfileId);
    const dateObj = new Date(`${targetDate}T12:00:00Z`);
    const dayOfWeek = dateObj.getUTCDay();

    // Check if whole day is blocked by time-off
    const isBlocked = (schedule.exceptions || []).some(
      (ex: any) => ex.date === targetDate && ex.isBlocked && !ex.startTime
    );

    if (isBlocked) {
      return NextResponse.json({
        date: targetDate,
        timezone: targetTz,
        isBlocked: true,
        slots: [],
      });
    }

    // Get active rules for this day of week
    const dayRules = (schedule.rules || []).filter(
      (r: any) => r.dayOfWeek === dayOfWeek && r.isActive
    );

    const duration = schedule.settings?.defaultLessonDuration || 50;
    const buffer = schedule.settings?.bufferMinutes || 10;
    const step = duration + buffer;

    const slots: Array<{ time: string; available: boolean; reason?: string }> = [];

    for (const rule of dayRules) {
      const [startH, startM] = rule.startTime.split(':').map(Number);
      const [endH, endM] = rule.endTime.split(':').map(Number);

      let currentMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;

      while (currentMin + duration <= endMin) {
        const h = Math.floor(currentMin / 60);
        const m = currentMin % 60;
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

        // Check if overlaps with existing lessons
        const slotStartIso = `${targetDate}T${timeStr}:00Z`;
        const isBooked = (schedule.upcomingLessons || []).some((l: any) => {
          return l.status !== 'CANCELLED' && l.scheduledStart.startsWith(`${targetDate}T${timeStr}`);
        });

        slots.push({
          time: timeStr,
          available: !isBooked,
          reason: isBooked ? 'Booked by student' : 'Open for booking',
        });

        currentMin += step;
      }
    }

    return NextResponse.json({
      date: targetDate,
      timezone: targetTz,
      isBlocked: false,
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

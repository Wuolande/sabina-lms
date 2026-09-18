/**
 * API Route: GET /api/tutor/availability
 *           PUT /api/tutor/availability
 * -----------------------------------------------------------------------
 * GET — Returns weekly recurring availability rules for logged-in tutor.
 * PUT — Saves weekly recurring schedule matrix to database.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { getTutorContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

function parseToMinutes(t: string): number {
  const parts = t.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const RulesSchema = z.object({
  rules: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().regex(timeRegex, 'Invalid start time format (HH:mm or HH:mm:ss)'),
      endTime: z.string().regex(timeRegex, 'Invalid end time format (HH:mm or HH:mm:ss)'),
      isActive: z.boolean(),
    })
  ).superRefine((rules, ctx) => {
    // 1. Validate individual shift durations
    rules.forEach((rule, idx) => {
      if (!rule.isActive) return;
      const startMin = parseToMinutes(rule.startTime);
      const endMin = parseToMinutes(rule.endTime);

      if (endMin <= startMin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${DAY_NAMES[rule.dayOfWeek]}: End time (${rule.endTime.slice(0, 5)}) must be after start time (${rule.startTime.slice(0, 5)})`,
          path: [idx, 'endTime'],
        });
      } else if (endMin - startMin < 15) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${DAY_NAMES[rule.dayOfWeek]}: Minimum shift length is 15 minutes`,
          path: [idx, 'endTime'],
        });
      }
    });

    // 2. Validate pairwise interval overlap per day
    for (let day = 0; day <= 6; day++) {
      const activeRules = rules
        .map((r, originalIdx) => ({ ...r, originalIdx }))
        .filter((r) => r.dayOfWeek === day && r.isActive);

      for (let i = 0; i < activeRules.length; i++) {
        const a = activeRules[i];
        const startA = parseToMinutes(a.startTime);
        const endA = parseToMinutes(a.endTime);
        if (endA <= startA) continue;

        for (let j = i + 1; j < activeRules.length; j++) {
          const b = activeRules[j];
          const startB = parseToMinutes(b.startTime);
          const endB = parseToMinutes(b.endTime);
          if (endB <= startB) continue;

          // Check interval intersection: startA < endB && endA > startB
          if (startA < endB && endA > startB) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `${DAY_NAMES[day]}: Shift #${i + 1} (${a.startTime.slice(0, 5)}–${a.endTime.slice(0, 5)}) overlaps with Shift #${j + 1} (${b.startTime.slice(0, 5)}–${b.endTime.slice(0, 5)})`,
              path: [b.originalIdx],
            });
          }
        }
      }
    }
  }),
});

export async function GET(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const rules = await domainLessonService.getTutorAvailability(tutor.tutorProfileId);
    return NextResponse.json(rules);
  } catch (error: any) {
    console.error('[GET /api/tutor/availability]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const body = await req.json();
    const parsed = RulesSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid availability format';
      return NextResponse.json(
        { error: firstError, issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const normalizedRules = parsed.data.rules.map((r) => ({
      ...r,
      startTime: r.startTime.length === 5 ? `${r.startTime}:00` : r.startTime,
      endTime: r.endTime.length === 5 ? `${r.endTime}:00` : r.endTime,
    }));

    await domainLessonService.saveTutorAvailability(tutor.tutorProfileId, normalizedRules);
    return NextResponse.json({ success: true, message: 'Availability rules saved.' });

  } catch (error: any) {
    console.error('[PUT /api/tutor/availability]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * API Route: POST /api/student/onboarding
 * -----------------------------------------------------------------------
 * Saves student onboarding preferences (goals, target subjects, level, pace)
 * directly to the database upon wizard completion.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainStudentService } from '@/src/modules/students/services/studentService';
import { getStudentContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const OnboardingSchema = z.object({
  targetExam: z.string().min(2),
  currentLevel: z.string().default('Intermediate'),
  weeklyStudyHoursTarget: z.number().min(1).max(50).default(5),
  initialGoalTitle: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const body = await req.json();
    const parsed = OnboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid onboarding payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    // 1. Upsert student profile
    await domainStudentService.updateProfile(student.userId, {
      targetExam: parsed.data.targetExam,
      currentLevel: parsed.data.currentLevel,
      weeklyStudyHoursTarget: parsed.data.weeklyStudyHoursTarget,
    });

    // 2. Add initial goal if provided
    if (parsed.data.initialGoalTitle) {
      await domainStudentService.addGoal(student.userId, {
        title: parsed.data.initialGoalTitle,
        subjectName: parsed.data.targetExam,
      });
    }

    return NextResponse.json({ success: true, message: 'Onboarding completed.' });

  } catch (error: any) {
    console.error('[POST /api/student/onboarding]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * API Route: GET /api/student/progress
 *           PUT /api/student/progress
 * -----------------------------------------------------------------------
 * GET — Returns student learning milestones, study statistics, enrolled
 *       instructors, roadmaps, and active goals.
 * PUT — Updates weekly study goal target and target exams.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainStudentService } from '@/src/modules/students/services/studentService';
import { getStudentContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const student360 = await domainStudentService.getStudent360(student.userId);

    const progress = {
      totalHoursLearned: student360.profile?.totalHoursLearned || 0,
      completedLessons: student360.profile?.completedLessons || 0,
      activeSubjects: student360.profile?.activeSubjectsCount || 1,
      learningStreakDays: student360.profile?.learningStreakDays || 0,
      weeklyStudyHoursTarget: student360.profile?.weeklyStudyHoursTarget || 6,
      targetExam: student360.profile?.targetExam || 'General Learning & Mastery',
      currentLevel: student360.profile?.currentLevel || 'Intermediate',
      goals: student360.goals || [],
      enrolledTutors: student360.enrolledTutors || [],
      profile: student360.profile,
    };

    return NextResponse.json(progress);

  } catch (error: any) {
    console.error('[GET /api/student/progress]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const body = await req.json();

    await domainStudentService.updateProfile(student.userId, {
      weeklyStudyHoursTarget: body.weeklyStudyHoursTarget ? Number(body.weeklyStudyHoursTarget) : undefined,
      targetExam: body.targetExam || undefined,
      currentLevel: body.currentLevel || undefined,
    });

    const updated = await domainStudentService.getStudent360(student.userId);
    return NextResponse.json({ success: true, profile: updated.profile });

  } catch (error: any) {
    console.error('[PUT /api/student/progress]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

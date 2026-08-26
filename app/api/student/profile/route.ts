/**
 * API Route: GET /api/student/profile
 *           PUT /api/student/profile
 * -----------------------------------------------------------------------
 * GET — Returns full student profile aggregate (identity, learning stats, enrolled tutors).
 * PUT — Update student profile preferences.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainStudentService } from '@/src/modules/students/services/studentService';
import { getStudentContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  preferredLanguage: z.string().optional(),
  phone: z.string().optional(),
  targetExam: z.string().optional(),
  currentLevel: z.string().optional(),
  weeklyStudyHoursTarget: z.number().min(1).max(50).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const student360 = await domainStudentService.getStudent360(student.userId);
    return NextResponse.json(student360);
  } catch (error: any) {
    console.error('[GET /api/student/profile]', error);
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
    const parsed = UpdateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid update payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    await domainStudentService.updateProfile(student.userId, parsed.data);
    return NextResponse.json({ success: true, message: 'Profile updated successfully.' });

  } catch (error: any) {
    console.error('[PUT /api/student/profile]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

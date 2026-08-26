/**
 * API Route: GET /api/student/favorites
 *           POST /api/student/favorites
 * -----------------------------------------------------------------------
 * GET  — Get student's favorited tutors.
 * POST — Toggle a tutor favorite. Body: { tutorProfileId: string }
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainStudentService } from '@/src/modules/students/services/studentService';
import { getStudentContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const ToggleSchema = z.object({
  tutorProfileId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const student360 = await domainStudentService.getStudent360(student.userId);
    return NextResponse.json(student360.favoriteTutors);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const body = await req.json();
    const parsed = ToggleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Tutor profile ID required.' }, { status: 400 });
    }

    const isFavorited = await domainStudentService.toggleFavoriteTutor(
      student.userId,
      parsed.data.tutorProfileId
    );

    return NextResponse.json({ success: true, isFavorited });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

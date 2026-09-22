import { NextRequest, NextResponse } from 'next/server';
import { apiErrorResponse } from '@/src/shared/api/apiError';
import { trainingRepository } from '@/src/modules/training/repositories/trainingRepository';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let tutorId = searchParams.get('tutorId') || undefined;

    if (!tutorId) {
      const tutorCtx = await getTutorContext(request).catch(() => null);
      if (tutorCtx) {
        tutorId = tutorCtx.tutorProfileId;
      }
    }

    const courses = await trainingRepository.getCourses(tutorId);
    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching training courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

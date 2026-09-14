import { NextRequest, NextResponse } from 'next/server';
import { trainingRepository } from '@/src/modules/training/repositories/trainingRepository';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await props.params;
    const slug = params.slug;
    const { searchParams } = new URL(request.url);
    let tutorId = searchParams.get('tutorId') || undefined;

    if (!tutorId) {
      const tutorCtx = await getTutorContext(request).catch(() => null);
      if (tutorCtx) {
        tutorId = tutorCtx.tutorProfileId;
      }
    }

    const course = await trainingRepository.getCourseBySlug(slug, tutorId);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Error fetching course detail:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}

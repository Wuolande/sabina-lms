import { NextResponse } from 'next/server';
import { trainingRepository } from '@/src/modules/training/repositories/trainingRepository';

export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await props.params;
    const slug = params.slug;
    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get('tutorId') || undefined;

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

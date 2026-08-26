import { NextResponse } from 'next/server';
import { trainingRepository } from '@/src/modules/training/repositories/trainingRepository';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const moduleId = params.id;
    const body = await request.json();
    const { courseId, tutorId } = body;

    const progress = await trainingRepository.completeModule(
      tutorId || 'f9e96316-0e63-44ef-a08a-6b2862a3c55f',
      moduleId,
      courseId
    );

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error('Error completing module:', error);
    return NextResponse.json({ error: 'Failed to complete module' }, { status: 500 });
  }
}

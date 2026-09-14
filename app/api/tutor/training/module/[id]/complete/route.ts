import { NextRequest, NextResponse } from 'next/server';
import { trainingRepository } from '@/src/modules/training/repositories/trainingRepository';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const moduleId = params.id;
    const tutorCtx = await getTutorContext(request);
    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    const progress = await trainingRepository.completeModule(
      tutorCtx.tutorProfileId,
      moduleId,
      courseId
    );

    return NextResponse.json({ success: true, progress });
  } catch (error: any) {
    console.error('Error completing module:', error);
    if (error?.name === 'UnauthorizedError' || error?.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error?.message || 'Failed to complete module' }, { status: 500 });
  }
}

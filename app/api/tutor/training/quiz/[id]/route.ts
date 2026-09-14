import { NextRequest, NextResponse } from 'next/server';
import { trainingRepository } from '@/src/modules/training/repositories/trainingRepository';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const quizId = params.id;
    const tutorCtx = await getTutorContext(request);
    const body = await request.json();
    const { courseId, answers } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    const result = await trainingRepository.submitQuiz(
      tutorCtx.tutorProfileId,
      quizId,
      courseId,
      answers || {}
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error submitting quiz:', error);
    if (error?.name === 'UnauthorizedError' || error?.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error?.message || 'Failed to submit quiz' }, { status: 500 });
  }
}

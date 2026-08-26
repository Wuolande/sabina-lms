import { NextResponse } from 'next/server';
import { trainingRepository } from '@/src/modules/training/repositories/trainingRepository';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const quizId = params.id;
    const body = await request.json();
    const { courseId, answers, tutorId } = body;

    const result = await trainingRepository.submitQuiz(
      tutorId || 'f9e96316-0e63-44ef-a08a-6b2862a3c55f',
      quizId,
      courseId,
      answers || {}
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
  }
}

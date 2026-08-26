import { NextResponse } from 'next/server';
import { trainingRepository } from '@/src/modules/training/repositories/trainingRepository';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const sessionId = params.id;
    const body = await request.json().catch(() => ({}));
    const tutorId = body.tutorId || 'f9e96316-0e63-44ef-a08a-6b2862a3c55f';
    const tutorName = body.tutorName || 'Dr. Elena Rostova';

    const result = await trainingRepository.registerForLiveSession(sessionId, tutorId, tutorName);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error registering for live session:', error);
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
  }
}

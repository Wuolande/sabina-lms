import { NextRequest, NextResponse } from 'next/server';
import { trainingRepository } from '@/src/modules/training/repositories/trainingRepository';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const sessionId = params.id;
    const tutorCtx = await getTutorContext(request);
    const body = await request.json().catch(() => ({}));
    const tutorId = body.tutorId || tutorCtx.tutorProfileId;
    const tutorName = body.tutorName || tutorCtx.displayName || 'Verified Tutor';

    const result = await trainingRepository.registerForLiveSession(sessionId, tutorId, tutorName);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error registering for live session:', error);
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
  }
}

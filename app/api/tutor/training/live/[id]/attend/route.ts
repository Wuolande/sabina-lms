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

    const result = await trainingRepository.confirmLiveAttendance(sessionId, tutorCtx.tutorProfileId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error confirming attendance:', error);
    if (error?.name === 'UnauthorizedError' || error?.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error?.message || 'Failed to confirm attendance' }, { status: 500 });
  }
}

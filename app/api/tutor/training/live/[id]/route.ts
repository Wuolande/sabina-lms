import { NextRequest, NextResponse } from 'next/server';
import { trainingRepository } from '@/src/modules/training/repositories/trainingRepository';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;
    const { searchParams } = new URL(request.url);
    let tutorId = searchParams.get('tutorId') || undefined;

    if (!tutorId) {
      const tutorCtx = await getTutorContext(request).catch(() => null);
      if (tutorCtx) {
        tutorId = tutorCtx.tutorProfileId;
      }
    }

    const session = await trainingRepository.getLiveSessionById(id, tutorId);
    if (!session) {
      return NextResponse.json({ error: 'Live session not found' }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error fetching live session detail:', error);
    return NextResponse.json({ error: 'Failed to fetch live session' }, { status: 500 });
  }
}

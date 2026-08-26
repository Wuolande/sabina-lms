import { NextResponse } from 'next/server';
import { trainingRepository } from '@/src/modules/training/repositories/trainingRepository';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;
    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get('tutorId') || 'f9e96316-0e63-44ef-a08a-6b2862a3c55f';

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

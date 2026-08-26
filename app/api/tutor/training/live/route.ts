import { NextResponse } from 'next/server';
import { trainingRepository } from '@/src/modules/training/repositories/trainingRepository';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get('tutorId') || 'f9e96316-0e63-44ef-a08a-6b2862a3c55f';

    const sessions = await trainingRepository.getLiveSessions(tutorId);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching live training sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch live sessions' }, { status: 500 });
  }
}

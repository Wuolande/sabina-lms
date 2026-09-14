import { NextRequest, NextResponse } from 'next/server';
import { trainingRepository } from '@/src/modules/training/repositories/trainingRepository';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let tutorId = searchParams.get('tutorId') || undefined;

    if (!tutorId) {
      const tutorCtx = await getTutorContext(request).catch(() => null);
      if (tutorCtx) {
        tutorId = tutorCtx.tutorProfileId;
      }
    }

    const certificates = await trainingRepository.getCertificates(tutorId);
    return NextResponse.json({ certificates });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}

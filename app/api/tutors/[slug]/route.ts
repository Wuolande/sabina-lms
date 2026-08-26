/**
 * API Route: GET /api/tutors/[slug]
 * -----------------------------------------------------------------------
 * Public marketplace profile lookup by tutor slug.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { tutorService } from '@/src/modules/tutors/services/tutorService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const profile = await tutorService.getPublicProfile(slug);

    if (!profile) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
    }

    return NextResponse.json(profile);

  } catch (error: any) {
    console.error('[GET /api/tutors/[slug]]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

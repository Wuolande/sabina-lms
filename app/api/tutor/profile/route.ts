/**
 * API Route: GET /api/tutor/profile
 *           PUT /api/tutor/profile
 * -----------------------------------------------------------------------
 * GET — Returns full profile aggregate for logged-in tutor.
 * PUT — Updates profile, bio, video intro, rates, and credentials atomically.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { tutorService } from '@/src/modules/tutors/services/tutorService';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const profile = await tutorService.getPublicProfile(tutor.tutorProfileId);
    return NextResponse.json(profile);

  } catch (error: any) {
    console.error('[GET /api/tutor/profile]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const body = await req.json();

    const updated = await tutorService.updatePublicProfile(tutor.tutorProfileId, body);
    return NextResponse.json({ success: true, profile: updated });

  } catch (error: any) {
    console.error('[PUT /api/tutor/profile]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

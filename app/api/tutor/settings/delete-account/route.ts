/**
 * API Route: POST /api/tutor/settings/delete-account
 * -----------------------------------------------------------------------
 * Permanently erases the tutor account under GDPR Right to Erasure.
 * Requires explicit reason and confirmation.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { tutorService } from '@/src/modules/tutors/services/tutorService';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function POST(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const body = await req.json();
    const { confirmation, reason } = body;

    if (confirmation !== 'DELETE MY ACCOUNT PERMANENTLY') {
      return NextResponse.json(
        { error: 'Confirmation phrase does not match. Please type "DELETE MY ACCOUNT PERMANENTLY".' },
        { status: 400 }
      );
    }

    const result = await tutorService.deleteAccountGdpr(
      tutor.tutorProfileId,
      reason || 'User initiated permanent erasure under GDPR'
    );

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[POST /api/tutor/settings/delete-account]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

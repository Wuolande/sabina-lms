/**
 * API Route: POST /api/tutor/settings/deactivate
 * -----------------------------------------------------------------------
 * Temporarily pauses and deactivates the tutor account.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { tutorService } from '@/src/modules/tutors/services/tutorService';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function POST(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'User requested account deactivation';

    const result = await tutorService.deactivateAccount(tutor.tutorProfileId, reason);
    return NextResponse.json({
      success: true,
      message: 'Your tutor account has been temporarily deactivated.',
      settings: result,
    });

  } catch (error: any) {
    console.error('[POST /api/tutor/settings/deactivate]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

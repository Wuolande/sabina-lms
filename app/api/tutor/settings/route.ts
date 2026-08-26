/**
 * API Route: GET /api/tutor/settings
 *           PUT /api/tutor/settings
 * -----------------------------------------------------------------------
 * GET — Returns full tutor settings 360 aggregate.
 * PUT — Updates rates, trial lesson price, discounts, payouts, and preferences.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { tutorService } from '@/src/modules/tutors/services/tutorService';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const settings = await tutorService.getSettings(tutor.tutorProfileId);
    return NextResponse.json(settings);

  } catch (error: any) {
    console.error('[GET /api/tutor/settings]', error);
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

    const updated = await tutorService.updateSettings(tutor.tutorProfileId, body);
    return NextResponse.json({ success: true, settings: updated });

  } catch (error: any) {
    console.error('[PUT /api/tutor/settings]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

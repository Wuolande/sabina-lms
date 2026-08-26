/**
 * API Route: GET /api/tutor/dashboard
 * -----------------------------------------------------------------------
 * Returns the complete Tutor Dashboard 360 executive aggregate:
 *  - Key Performance Metrics (earnings, lessons, active students, ratings)
 *  - Immediate upcoming lesson callout with direct LiveKit room link
 *  - Upcoming classes queue
 *  - Recent student reviews & replies
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { tutorService } from '@/src/modules/tutors/services/tutorService';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const dashboard = await tutorService.getDashboard360(tutor.tutorProfileId);
    return NextResponse.json(dashboard);

  } catch (error: any) {
    console.error('[GET /api/tutor/dashboard]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * API Route: GET /api/tutor/settings/export-data
 * -----------------------------------------------------------------------
 * Generates and downloads a complete JSON GDPR data export package.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { tutorService } from '@/src/modules/tutors/services/tutorService';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const exportData = await tutorService.exportGdprData(tutor.tutorProfileId);

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="sabina_tutor_gdpr_export_${tutor.tutorProfileId}.json"`,
      },
    });

  } catch (error: any) {
    console.error('[GET /api/tutor/settings/export-data]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

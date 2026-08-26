/**
 * API Route: DELETE /api/tutor/schedule/exceptions/[id]
 * -----------------------------------------------------------------------
 * Deletes a date-specific vacation or time-off exception.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tutor = await getTutorContext(req);

    await domainLessonService.deleteTimeOffException(id, tutor.tutorProfileId);
    return NextResponse.json({ success: true, message: 'Exception deleted.' });

  } catch (error: any) {
    console.error('[DELETE /api/tutor/schedule/exceptions/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

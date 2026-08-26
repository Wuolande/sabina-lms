/**
 * API Route: DELETE /api/tutor/lessons/[id]/materials/[materialId]
 * -----------------------------------------------------------------------
 * Removes an attached worksheet/material from a lesson.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; materialId: string }> }
) {
  try {
    const { id, materialId } = await params;
    await getTutorContext(req);

    await domainLessonService.deleteMaterial(materialId, id);
    return NextResponse.json({ success: true, message: 'Material removed.' });

  } catch (error: any) {
    console.error('[DELETE /api/tutor/lessons/[id]/materials/[materialId]]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

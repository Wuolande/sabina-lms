/**
 * API Route: POST /api/tutor/lessons/[id]/complete
 * -----------------------------------------------------------------------
 * Completes a lesson, recording student feedback, private notes, and
 * atomically updating student & tutor hour metrics.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { getTutorContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const CompleteSchema = z.object({
  studentFeedback: z.string().optional(),
  privateNotes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tutor = await getTutorContext(req);
    const body = await req.json().catch(() => ({}));
    const parsed = CompleteSchema.safeParse(body);

    const result = await domainLessonService.completeLesson(
      id,
      parsed.success ? parsed.data.studentFeedback : undefined,
      parsed.success ? parsed.data.privateNotes : undefined,
      { id: tutor.userId, displayName: tutor.displayName, role: 'TUTOR' }
    );

    return NextResponse.json({ success: true, result });

  } catch (error: any) {
    console.error('[POST /api/tutor/lessons/[id]/complete]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

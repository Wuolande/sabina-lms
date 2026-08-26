/**
 * API Route: GET /api/tutor/lessons/[id]
 *           PUT /api/tutor/lessons/[id]
 * -----------------------------------------------------------------------
 * GET — Returns full 360 lesson workspace aggregate.
 * PUT — Updates curriculum topic, homework, private notes, and student feedback.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { getTutorContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const UpdateWorkspaceSchema = z.object({
  curriculumTopic: z.string().optional(),
  homeworkAssigned: z.string().optional(),
  homeworkDueDate: z.string().optional(),
  privateTutorNotes: z.string().optional(),
  studentFeedback: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tutor = await getTutorContext(req);

    const lesson = await domainLessonService.getTutorLesson360(id, tutor.tutorProfileId);
    return NextResponse.json(lesson);

  } catch (error: any) {
    console.error('[GET /api/tutor/lessons/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tutor = await getTutorContext(req);
    const body = await req.json();
    const parsed = UpdateWorkspaceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid workspace parameters' }, { status: 400 });
    }

    const updated = await domainLessonService.updateLessonWorkspace(
      id,
      tutor.tutorProfileId,
      parsed.data
    );

    return NextResponse.json({ success: true, lesson: updated });

  } catch (error: any) {
    console.error('[PUT /api/tutor/lessons/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

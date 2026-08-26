/**
 * API Route: POST /api/student/lessons/[id]/review
 * -----------------------------------------------------------------------
 * Submits a 1-5 star review and comment for a completed lesson.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { getStudentContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const ReviewSchema = z.object({
  tutorId: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = await getStudentContext(req);
    const body = await req.json();
    const parsed = ReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Valid 1-5 rating is required.' }, { status: 400 });
    }

    const review = await domainLessonService.submitReview(
      id,
      student.userId,
      parsed.data.tutorId,
      parsed.data.rating,
      parsed.data.comment
    );

    return NextResponse.json({ success: true, review }, { status: 201 });

  } catch (error: any) {
    console.error('[POST /api/student/lessons/[id]/review]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

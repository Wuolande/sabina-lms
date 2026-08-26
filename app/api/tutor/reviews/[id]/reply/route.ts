/**
 * API Route: POST /api/tutor/reviews/[id]/reply
 * -----------------------------------------------------------------------
 * Publishes tutor reply to a review and notifies the student.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { getTutorContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const ReplySchema = z.object({
  reply: z.string().min(2, 'Reply text must be at least 2 characters'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tutor = await getTutorContext(req);
    const body = await req.json();

    const parsed = ReplySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid reply format: Message cannot be empty.' },
        { status: 400 }
      );
    }

    const data = await domainLessonService.replyToReviewAtomic(
      id,
      tutor.tutorProfileId,
      parsed.data.reply
    );

    return NextResponse.json({ success: true, review: data });

  } catch (error: any) {
    console.error('[POST /api/tutor/reviews/[id]/reply]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

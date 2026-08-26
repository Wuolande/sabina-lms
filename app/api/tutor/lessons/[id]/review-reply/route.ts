/**
 * API Route: POST /api/tutor/lessons/[id]/review-reply
 * -----------------------------------------------------------------------
 * Posts a tutor response to a student review.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { getTutorContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const ReplySchema = z.object({
  reply: z.string().min(2, 'Reply must be at least 2 characters.'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getTutorContext(req);
    const body = await req.json();
    const parsed = ReplySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Valid reply text required' }, { status: 400 });
    }

    const review = await domainLessonService.replyToReview(id, parsed.data.reply);
    return NextResponse.json({ success: true, review });

  } catch (error: any) {
    console.error('[POST /api/tutor/lessons/[id]/review-reply]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

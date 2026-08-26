/**
 * API Route: POST /api/messages/conversations/start
 * -----------------------------------------------------------------------
 * Starts or retrieves an existing conversation with a tutor/student.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainMessageService } from '@/src/modules/messaging/services/messageService';
import { getStudentContext, getTutorContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const StartSchema = z.object({
  tutorProfileId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  initialMessage: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = StartSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    let studentId = parsed.data.studentId;
    let tutorProfileId = parsed.data.tutorProfileId;

    if (!studentId) {
      const student = await getStudentContext(req);
      studentId = student.userId;
    }

    if (!tutorProfileId) {
      const tutor = await getTutorContext(req);
      tutorProfileId = tutor.tutorProfileId;
    }

    if (!studentId || !tutorProfileId) {
      return NextResponse.json({ error: 'Both student and tutor profile ID are required' }, { status: 400 });
    }

    const conversationId = await domainMessageService.findOrCreateConversation(
      studentId,
      tutorProfileId,
      parsed.data.initialMessage
    );

    return NextResponse.json({ success: true, conversationId });

  } catch (error: any) {
    console.error('[POST /api/messages/conversations/start]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

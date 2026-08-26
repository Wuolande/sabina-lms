/**
 * API Route: GET /api/messages/conversations/[id]
 * -----------------------------------------------------------------------
 * Returns all messages in a conversation and marks unread incoming messages as read.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainMessageService } from '@/src/modules/messaging/services/messageService';
import { getStudentContext, getTutorContext } from '@/src/shared/auth/authService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let userId: string;
    try {
      const student = await getStudentContext(req);
      userId = student.userId;
    } catch {
      const tutor = await getTutorContext(req);
      userId = tutor.userId;
    }

    const messages = await domainMessageService.getConversationMessages(id, userId);
    return NextResponse.json(messages);

  } catch (error: any) {
    console.error('[GET /api/messages/conversations/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * API Route: GET /api/messages/conversations
 * -----------------------------------------------------------------------
 * Returns all conversations for the authenticated user (student or tutor).
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainMessageService } from '@/src/modules/messaging/services/messageService';
import { getStudentContext, getTutorContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    let userId: string;
    try {
      const student = await getStudentContext(req);
      userId = student.userId;
    } catch {
      const tutor = await getTutorContext(req);
      userId = tutor.userId;
    }

    const conversations = await domainMessageService.getUserConversations(userId);
    return NextResponse.json(conversations);

  } catch (error: any) {
    console.error('[GET /api/messages/conversations]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

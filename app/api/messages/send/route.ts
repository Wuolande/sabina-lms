/**
 * API Route: POST /api/messages/send
 * -----------------------------------------------------------------------
 * Sends a message atomically with anti-circumvention and spam filtering.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainMessageService } from '@/src/modules/messaging/services/messageService';
import { getStudentContext, getTutorContext } from '@/src/shared/auth/authService';
import { getSecuritySettings } from '@/src/shared/security/recaptchaService';
import { sanitizeMessageContent } from '@/src/shared/security/contentFilter';
import { z } from 'zod';

const SendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1, 'Message content cannot be empty'),
  attachments: z.array(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    let userId: string;
    try {
      const student = await getStudentContext(req);
      userId = student.userId;
    } catch {
      const tutor = await getTutorContext(req);
      userId = tutor.userId;
    }

    // Apply security content & anti-circumvention filter
    const securitySettings = await getSecuritySettings();
    let finalContent = parsed.data.content;

    if (securitySettings.antiSpamChatFilter) {
      const filterResult = sanitizeMessageContent(parsed.data.content, {
        filterEnabled: true,
        redactSensitiveInfo: true,
        allowEmails: false,
      });
      finalContent = filterResult.sanitizedContent;
    }

    const message = await domainMessageService.sendMessage(
      parsed.data.conversationId,
      userId,
      finalContent,
      parsed.data.attachments
    );

    return NextResponse.json({ success: true, message });

  } catch (error: any) {
    console.error('[POST /api/messages/send]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

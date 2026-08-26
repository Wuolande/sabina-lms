/**
 * API Route: POST /api/notifications/read
 * -----------------------------------------------------------------------
 * Marks notification(s) as read.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainNotificationService } from '@/src/modules/notifications/services/notificationService';
import { getStudentContext, getTutorContext } from '@/src/shared/auth/authService';

export async function POST(req: NextRequest) {
  try {
    let userId: string;
    try {
      const student = await getStudentContext(req);
      userId = student.userId;
    } catch {
      const tutor = await getTutorContext(req);
      userId = tutor.userId;
    }

    const body = await req.json().catch(() => ({}));
    await domainNotificationService.markAsRead(userId, body.notificationId);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[POST /api/notifications/read]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

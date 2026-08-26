/**
 * API Route: GET /api/notifications
 * -----------------------------------------------------------------------
 * Returns notifications and unread count for authenticated user.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainNotificationService } from '@/src/modules/notifications/services/notificationService';
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

    const data = await domainNotificationService.getUserNotifications(userId);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[GET /api/notifications]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * API Route: POST /api/admin/users/[id]/reactivate
 * -----------------------------------------------------------------------
 * Reactivates a suspended user account with immutable audit log.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/src/modules/users/services/userService';
import { getAdminContext } from '@/src/shared/auth/authService';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await getAdminContext(req);

    await userService.reactivateUser(id, admin, {
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true, message: 'User account reactivated.' });

  } catch (error: any) {
    console.error('[POST /api/admin/users/[id]/reactivate]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

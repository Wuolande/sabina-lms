/**
 * API Route: POST /api/admin/users/[id]/suspend
 * -----------------------------------------------------------------------
 * Suspends any user account with stated reason and immutable audit log.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/src/modules/users/services/userService';
import { getAdminContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const Schema = z.object({ reason: z.string().min(5, 'Suspension reason must be at least 5 characters.') });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await getAdminContext(req);
    const body = await req.json();
    const parsed = Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.format() },
        { status: 400 }
      );
    }

    await userService.suspendUser(id, admin, parsed.data.reason, {
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true, message: 'User account suspended.' });

  } catch (error: any) {
    console.error('[POST /api/admin/users/[id]/suspend]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

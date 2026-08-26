/**
 * API Route: POST /api/admin/tutors/[id]/suspend
 * -----------------------------------------------------------------------
 * Suspends a tutor account.
 * Requires ADMIN role + tutors.suspend permission.
 *
 * Body: { reason: string }
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { tutorService } from '@/src/modules/tutors/services/tutorService';
import { getAdminContext } from '@/src/shared/auth/authService';
import { requirePermission } from '@/src/shared/permissions/rbac';
import { Permissions } from '@/src/shared/permissions/permissions';
import { z } from 'zod';

const SuspendSchema = z.object({
  reason: z.string().min(5, 'Suspension reason must be at least 5 characters.'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await getAdminContext(req);
    requirePermission(admin, Permissions.TUTORS_SUSPEND);

    const body = await req.json();
    const parsed = SuspendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.format() },
        { status: 400 }
      );
    }

    await tutorService.suspendTutor(id, admin, parsed.data.reason, {
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true, message: 'Tutor account suspended.' });

  } catch (error: any) {
    console.error('[POST /api/admin/tutors/[id]/suspend]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * API Route: POST /api/admin/tutors/[id]/reactivate
 * -----------------------------------------------------------------------
 * Reactivates a suspended tutor account.
 * Requires ADMIN role + tutors.reactivate permission.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { tutorService } from '@/src/modules/tutors/services/tutorService';
import { getAdminContext } from '@/src/shared/auth/authService';
import { requirePermission } from '@/src/shared/permissions/rbac';
import { Permissions } from '@/src/shared/permissions/permissions';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await getAdminContext(req);
    requirePermission(admin, Permissions.TUTORS_REACTIVATE);

    await tutorService.reactivateTutor(id, admin, {
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true, message: 'Tutor account reactivated.' });

  } catch (error: any) {
    console.error('[POST /api/admin/tutors/[id]/reactivate]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

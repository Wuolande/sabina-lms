/**
 * API Route: POST /api/admin/tutor-applications/[id]/approve
 * -----------------------------------------------------------------------
 * Approves a tutor application and atomically provisions the tutor profile
 * via the provision_tutor_from_application() PostgreSQL function.
 *
 * Body: { approvalNotes?: string }
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { tutorApplicationService } from '@/src/modules/tutor-applications/services/tutorApplicationService';
import { getAdminContext } from '@/src/shared/auth/authService';
import { requirePermission } from '@/src/shared/permissions/rbac';
import { Permissions } from '@/src/shared/permissions/permissions';
import { z } from 'zod';

const ApproveSchema = z.object({
  approvalNotes: z.string().max(1000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await getAdminContext(req);
    requirePermission(admin, Permissions.TUTOR_APPLICATIONS_APPROVE);

    const body = await req.json().catch(() => ({}));
    const parsed = ApproveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await tutorApplicationService.approve(id, admin, {
      approvalNotes: parsed.data.approvalNotes,
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Application approved. Tutor profile provisioned.',
      tutorProfileId: result.tutorProfileId,
    });

  } catch (error: any) {
    console.error('[POST /api/admin/tutor-applications/[id]/approve]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

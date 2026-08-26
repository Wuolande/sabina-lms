/**
 * API Route: GET /api/admin/tutor-applications/[id]
 * -----------------------------------------------------------------------
 * Get full application detail with all related data & audit history.
 * Requires ADMIN role + tutor_applications.view permission.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { tutorApplicationService } from '@/src/modules/tutor-applications/services/tutorApplicationService';
import { auditRepository } from '@/src/shared/audit/auditRepository';
import { getAdminContext } from '@/src/shared/auth/authService';
import { requirePermission } from '@/src/shared/permissions/rbac';
import { Permissions } from '@/src/shared/permissions/permissions';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await getAdminContext(req);
    requirePermission(admin, Permissions.TUTOR_APPLICATIONS_VIEW);

    const [application, auditTrail] = await Promise.all([
      tutorApplicationService.getApplication(id),
      auditRepository.queryByEntity('TUTOR_APPLICATION', id),
    ]);

    return NextResponse.json({
      ...application,
      auditTrail,
    });

  } catch (error: any) {
    console.error('[GET /api/admin/tutor-applications/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * API Route: POST /api/admin/tutor-applications/[id]/reopen
 * -----------------------------------------------------------------------
 * Re-opens a rejected application back to UNDER_REVIEW.
 * Only admins with tutor_applications.reopen permission can do this.
 *
 * Body: { notes: string }
 * -----------------------------------------------------------------------
 */
import { NextRequest, NextResponse } from 'next/server';
import { tutorApplicationService } from '@/src/modules/tutor-applications/services/tutorApplicationService';
import { getAdminContext } from '@/src/shared/auth/authService';
import { requirePermission } from '@/src/shared/permissions/rbac';
import { Permissions } from '@/src/shared/permissions/permissions';
import { z } from 'zod';

const Schema = z.object({ notes: z.string().min(5, 'A reason for reopening is required.') });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await getAdminContext(req);
    requirePermission(admin, Permissions.TUTOR_APPLICATIONS_REOPEN);
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Reason required (min 5 chars).' }, { status: 400 });

    await tutorApplicationService.reopenApplication(id, admin, parsed.data.notes, {
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });
    return NextResponse.json({ success: true, message: 'Application reopened for review.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

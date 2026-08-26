/**
 * API Route: POST /api/admin/tutor-applications/[id]/request-changes
 * Body: { requestedChanges: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { tutorApplicationService } from '@/src/modules/tutor-applications/services/tutorApplicationService';
import { getAdminContext } from '@/src/shared/auth/authService';
import { requirePermission } from '@/src/shared/permissions/rbac';
import { Permissions } from '@/src/shared/permissions/permissions';
import { z } from 'zod';

const Schema = z.object({ requestedChanges: z.string().min(5) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await getAdminContext(req);
    requirePermission(admin, Permissions.TUTOR_APPLICATIONS_REQUEST_CHANGES);
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Change instructions required (min 5 chars).' }, { status: 400 });

    await tutorApplicationService.requestChanges(id, admin, parsed.data.requestedChanges, {
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

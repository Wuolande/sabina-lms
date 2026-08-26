/**
 * API Route: POST /api/admin/tutor-applications/[id]/review
 * Moves application to UNDER_REVIEW status.
 * Body: { notes?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { tutorApplicationService } from '@/src/modules/tutor-applications/services/tutorApplicationService';
import { getAdminContext } from '@/src/shared/auth/authService';
import { requirePermission } from '@/src/shared/permissions/rbac';
import { Permissions } from '@/src/shared/permissions/permissions';
import { z } from 'zod';

const Schema = z.object({ notes: z.string().max(500).optional() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await getAdminContext(req);
    requirePermission(admin, Permissions.TUTOR_APPLICATIONS_REVIEW);
    const body = await req.json().catch(() => ({}));
    const parsed = Schema.safeParse(body);

    await tutorApplicationService.startReview(id, admin, {
      notes: parsed.success ? parsed.data.notes : undefined,
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

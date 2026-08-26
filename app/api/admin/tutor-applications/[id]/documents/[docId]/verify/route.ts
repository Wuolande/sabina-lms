/**
 * API Route: POST /api/admin/tutor-applications/[id]/documents/[docId]/verify
 * -----------------------------------------------------------------------
 * Marks a specific application document as VERIFIED or REJECTED.
 * Requires ADMIN role + documents.verify permission.
 *
 * Body: { status: 'VERIFIED' | 'REJECTED', notes?: string }
 * -----------------------------------------------------------------------
 */
import { NextRequest, NextResponse } from 'next/server';
import { tutorApplicationService } from '@/src/modules/tutor-applications/services/tutorApplicationService';
import { getAdminContext } from '@/src/shared/auth/authService';
import { requirePermission } from '@/src/shared/permissions/rbac';
import { Permissions } from '@/src/shared/permissions/permissions';
import { z } from 'zod';

const Schema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  notes: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params;
    const admin = await getAdminContext(req);
    requirePermission(admin, Permissions.DOCUMENTS_VERIFY);

    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const document = await tutorApplicationService.verifyDocument(
      id,
      docId,
      admin,
      parsed.data.status,
      parsed.data.notes,
      {
        ipAddress: req.headers.get('x-forwarded-for') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
      }
    );

    return NextResponse.json({ success: true, document });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

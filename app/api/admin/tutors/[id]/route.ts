/**
 * API Route: GET /api/admin/tutors/[id]
 *           PATCH /api/admin/tutors/[id]
 * -----------------------------------------------------------------------
 * GET  — Returns full Tutor 360° aggregate (all 9 sections) using the
 *         get_tutor_360_aggregate PostgreSQL function.
 * PATCH — Updates tutor profile fields (rate, featured, superTutor badge).
 *
 * Requires ADMIN role + corresponding permission per operation.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { tutorService } from '@/src/modules/tutors/services/tutorService';
import { getAdminContext } from '@/src/shared/auth/authService';
import { requirePermission } from '@/src/shared/permissions/rbac';
import { Permissions } from '@/src/shared/permissions/permissions';
import { z } from 'zod';

const UpdateTutorSchema = z.object({
  hourlyRate: z.number().min(1).max(10000).optional(),
  toggleFeatured: z.boolean().optional(),
  toggleSuperTutor: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await getAdminContext(req);
    requirePermission(admin, Permissions.TUTORS_VIEW);

    const tutor360 = await tutorService.getTutor360(id);
    return NextResponse.json(tutor360);

  } catch (error: any) {
    console.error('[GET /api/admin/tutors/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await getAdminContext(req);

    const body = await req.json();
    const parsed = UpdateTutorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const meta = {
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    };

    const results: Record<string, any> = {};

    if (parsed.data.hourlyRate !== undefined) {
      requirePermission(admin, Permissions.TUTORS_RATE_EDIT);
      await tutorService.updateTutorRate(id, admin, parsed.data.hourlyRate, meta);
      results.hourlyRate = parsed.data.hourlyRate;
    }

    if (parsed.data.toggleFeatured !== undefined) {
      requirePermission(admin, Permissions.TUTORS_FEATURE);
      const newValue = await tutorService.toggleFeatured(id, admin, meta);
      results.isFeatured = newValue;
    }

    if (parsed.data.toggleSuperTutor !== undefined) {
      requirePermission(admin, Permissions.TUTORS_SUPER_BADGE);
      const newValue = await tutorService.toggleSuperTutor(id, admin, meta);
      results.isSuperTutor = newValue;
    }

    return NextResponse.json({ success: true, updated: results });

  } catch (error: any) {
    console.error('[PATCH /api/admin/tutors/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

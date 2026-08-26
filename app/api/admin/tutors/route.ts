/**
 * API Route: GET /api/admin/tutors
 * -----------------------------------------------------------------------
 * Lists all active tutors with pagination, filters, and search.
 * Requires ADMIN role + tutors.view permission.
 *
 * Query params:
 *   status     — ACTIVE | SUSPENDED | INACTIVE (default: all)
 *   search     — full-text search on headline, bio, display_name
 *   subject    — filter by subject name
 *   isFeatured — true | false
 *   page       — page number (default: 1)
 *   limit      — results per page (default: 20, max: 100)
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { tutorService } from '@/src/modules/tutors/services/tutorService';
import { getAdminContext } from '@/src/shared/auth/authService';
import { requirePermission } from '@/src/shared/permissions/rbac';
import { Permissions } from '@/src/shared/permissions/permissions';
import { z } from 'zod';

const FilterTutorsSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
  search: z.string().max(200).optional(),
  subject: z.string().max(100).optional(),
  isFeatured: z.coerce.boolean().optional(),
  isSuperTutor: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminContext(req);
    requirePermission(admin, Permissions.TUTORS_VIEW);

    const { searchParams } = new URL(req.url);
    const parsed = FilterTutorsSchema.safeParse({
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      subject: searchParams.get('subject') || undefined,
      isFeatured: searchParams.get('isFeatured') || undefined,
      isSuperTutor: searchParams.get('isSuperTutor') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await tutorService.listTutors(parsed.data);

    const response = NextResponse.json(result);
    response.headers.set('X-Total-Count', String(result.total));
    response.headers.set('X-Page', String(result.page));
    response.headers.set('X-Limit', String(result.limit));
    return response;

  } catch (error: any) {
    console.error('[GET /api/admin/tutors]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * API Route: GET /api/admin/tutor-applications
 * -----------------------------------------------------------------------
 * Lists tutor applications with pagination, status filter, and search.
 * Requires ADMIN role + tutor_applications.view permission.
 *
 * Query params:
 *   status        — DRAFT|SUBMITTED|UNDER_REVIEW|REQUESTED_CHANGES|RESUBMITTED|REJECTED|APPROVED
 *   search        — search on headline, bio
 *   submittedFrom — ISO date string
 *   submittedTo   — ISO date string
 *   page          — page number (default: 1)
 *   limit         — results per page (default: 20)
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { tutorApplicationService } from '@/src/modules/tutor-applications/services/tutorApplicationService';
import { getAdminContext } from '@/src/shared/auth/authService';
import { requirePermission } from '@/src/shared/permissions/rbac';
import { Permissions } from '@/src/shared/permissions/permissions';
import { z } from 'zod';

const FilterSchema = z.object({
  status: z.string().optional(),
  search: z.string().max(200).optional(),
  submittedFrom: z.string().optional(),
  submittedTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminContext(req);
    requirePermission(admin, Permissions.TUTOR_APPLICATIONS_VIEW);

    const { searchParams } = new URL(req.url);
    const parsed = FilterSchema.safeParse({
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      submittedFrom: searchParams.get('submittedFrom') || undefined,
      submittedTo: searchParams.get('submittedTo') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await tutorApplicationService.listApplications(parsed.data);

    const response = NextResponse.json(result);
    response.headers.set('X-Total-Count', String(result.total));
    response.headers.set('X-Page', String(result.page));
    response.headers.set('X-Limit', String(result.limit));
    return response;

  } catch (error: any) {
    console.error('[GET /api/admin/tutor-applications]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

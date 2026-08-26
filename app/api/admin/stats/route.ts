/**
 * API Route: GET /api/admin/stats
 * -----------------------------------------------------------------------
 * Returns live admin dashboard statistics from Supabase.
 * Uses the admin_stats_view (migration 007) for efficient aggregation.
 * Requires ADMIN role.
 * -----------------------------------------------------------------------
 */
import { NextRequest, NextResponse } from 'next/server';
import { tutorService } from '@/src/modules/tutors/services/tutorService';
import { tutorApplicationService } from '@/src/modules/tutor-applications/services/tutorApplicationService';
import { getAdminContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminContext(req);

    const [stats, statusCounts] = await Promise.all([
      tutorService.getAdminStats(),
      tutorApplicationService.getStatusCounts(),
    ]);

    return NextResponse.json({
      ...stats,
      applicationStatusCounts: statusCounts,
    });
  } catch (error: any) {
    console.error('[GET /api/admin/stats]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

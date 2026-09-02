/**
 * API Route: GET /api/admin/stats
 * -----------------------------------------------------------------------
 * Returns live admin dashboard statistics from Supabase.
 * Computes users, bookings, completed lessons, and revenue metrics.
 * -----------------------------------------------------------------------
 */
import { NextRequest, NextResponse } from 'next/server';
import { tutorService } from '@/src/modules/tutors/services/tutorService';
import { tutorApplicationService } from '@/src/modules/tutor-applications/services/tutorApplicationService';
import { getAdminSupabaseClient } from '@/src/shared/database/supabase';
import { isAdmin } from '@/src/shared/auth/authService';
import { getPlatformPolicies } from '@/src/shared/config/platformPolicies';

export async function GET(req: NextRequest) {
  try {
    const isUserAdmin = await isAdmin(req);
    if (!isUserAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const supabase = getAdminSupabaseClient();

    const [stats, statusCounts, bookingsRes, lessonsRes, disputesRes, policies] = await Promise.all([
      tutorService.getAdminStats(),
      tutorApplicationService.getStatusCounts(),
      supabase.from('bookings').select('id, price, status, payment_status'),
      supabase.from('lessons').select('id, status'),
      supabase.from('booking_disputes').select('id, status').eq('status', 'OPEN'),
      getPlatformPolicies(),
    ]);

    const bookings = bookingsRes.data || [];
    const lessons = lessonsRes.data || [];
    const disputes = disputesRes.data || [];

    const completedLessonsCount = lessons.filter((l) => l.status === 'COMPLETED').length;
    const paidBookings = bookings.filter((b) => b.payment_status === 'PAID' || b.status === 'COMPLETED' || b.status === 'CONFIRMED');

    const grossRevenue = paidBookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
    const feeDecimal = (policies.platformFeePercent || 18.0) / 100;
    const platformFees = Math.round(grossRevenue * feeDecimal * 100) / 100;
    const tutorPayouts = Math.round((grossRevenue - platformFees) * 100) / 100;

    return NextResponse.json({
      ...stats,
      applicationStatusCounts: statusCounts,
      totalBookings: bookings.length,
      completedLessons: completedLessonsCount,
      grossRevenue,
      platformFees,
      tutorPayouts,
      activeDisputes: disputes.length,
    });
  } catch (error: any) {
    console.error('[GET /api/admin/stats]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

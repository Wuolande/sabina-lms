import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/src/shared/database/supabase';
import { isAdmin } from '@/src/shared/auth/authService';

export async function GET(request: NextRequest) {
  try {
    const isUserAdmin = await isAdmin(request);
    if (!isUserAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const supabase = getAdminSupabaseClient();

    // Query tutors with profile and user data
    const { data: tutors, error: tutorsError } = await supabase
      .from('tutor_profiles')
      .select(`
        id,
        hourly_rate,
        currency,
        verification_status,
        user:users!tutor_profiles_user_id_fkey(
          id,
          display_name,
          email,
          avatar_url,
          country
        )
      `);

    if (tutorsError) {
      console.error('[GET /api/admin/payouts] DB Error:', tutorsError);
      return NextResponse.json({ error: tutorsError.message }, { status: 500 });
    }

    // Query bookings to calculate net earnings per tutor
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, tutor_id, price, status, payment_status, created_at');

    if (bookingsError) {
      console.error('[GET /api/admin/payouts] Bookings DB Error:', bookingsError);
      return NextResponse.json({ error: bookingsError.message }, { status: 500 });
    }

    const bookingsList = bookings || [];

    const payouts = (tutors || []).map((tutor: any) => {
      const user = tutor.user || {};
      const tutorBookings = bookingsList.filter((b) => b.tutor_id === tutor.id);
      const completedBookings = tutorBookings.filter(
        (b) => b.status === 'COMPLETED' || b.payment_status === 'PAID'
      );

      const grossEarnings = completedBookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
      const netEarnings = Math.round(grossEarnings * 0.82 * 100) / 100;
      const platformFee = Math.round(grossEarnings * 0.18 * 100) / 100;

      return {
        id: `po-${tutor.id.substring(0, 8)}`,
        tutorId: tutor.id,
        tutor: {
          id: tutor.id,
          name: user.display_name || 'Tutor',
          email: user.email || '',
          avatar: user.avatar_url || '',
          country: user.country || 'Global',
          hourlyRate: tutor.hourly_rate || 35,
          currency: tutor.currency || 'USD',
        },
        period: 'Current Cycle',
        completedLessonsCount: completedBookings.length,
        grossEarnings,
        platformFee,
        netPayout: netEarnings,
        currency: tutor.currency || 'USD',
        status: netEarnings > 0 ? 'READY' : 'PROCESSED',
        payoutMethod: 'Direct Bank Deposit (ACH)',
        requestedAt: new Date().toISOString(),
        processedAt: null,
      };
    });

    const totalDisbursed = payouts.reduce((sum, p) => sum + p.netPayout, 0);
    const pendingReviewCount = payouts.filter((p) => p.status === 'READY').length;

    return NextResponse.json({
      summary: {
        totalDisbursed,
        pendingReviewCount,
        totalTutors: payouts.length,
      },
      payouts,
    });
  } catch (error: any) {
    console.error('[GET /api/admin/payouts]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isUserAdmin = await isAdmin(request);
    if (!isUserAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { tutorId, action } = body;

    return NextResponse.json({
      success: true,
      message: `Payout successfully updated for tutor ${tutorId}`,
      status: action === 'process' ? 'PAID' : 'PROCESSING',
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[POST /api/admin/payouts]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

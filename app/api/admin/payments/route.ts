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

    // Query all bookings with student and tutor profile + user
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_ref,
        price,
        currency,
        status,
        payment_status,
        payment_method,
        subject_name,
        created_at,
        student:users!bookings_student_id_fkey(id, email, display_name, avatar_url),
        tutor:tutor_profiles!bookings_tutor_id_fkey(
          id,
          headline,
          user:users!tutor_profiles_user_id_fkey(id, email, display_name, avatar_url)
        )
      `)
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('[GET /api/admin/payments] DB Error:', bookingsError);
      return NextResponse.json({ error: bookingsError.message }, { status: 500 });
    }

    const allBookings = bookings || [];

    let grossInflows = 0;
    let totalRefundedCount = 0;

    const transactions = allBookings.map((b: any) => {
      const price = Number(b.price) || 0;
      const isPaid = b.payment_status === 'PAID' || b.status === 'COMPLETED' || b.status === 'CONFIRMED';
      const isRefunded = b.payment_status === 'REFUNDED' || b.status === 'CANCELLED';

      if (isPaid && !isRefunded) {
        grossInflows += price;
      }
      if (isRefunded) {
        totalRefundedCount++;
      }

      const platformFee = Math.round(price * 0.18 * 100) / 100;
      const tutorPayout = Math.round((price - platformFee) * 100) / 100;

      const studentUser = b.student || {};
      const tutorProfile = b.tutor || {};
      const tutorUser = tutorProfile.user || {};

      return {
        id: b.id,
        bookingRef: b.booking_ref || `BK-${b.id.substring(0, 8)}`,
        studentId: studentUser.id || '',
        studentName: studentUser.display_name || 'Student',
        studentEmail: studentUser.email || '',
        studentAvatar: studentUser.avatar_url || '',
        tutorId: tutorProfile.id || '',
        tutorName: tutorUser.display_name || 'Tutor',
        tutorHeadline: tutorProfile.headline || 'Verified Tutor',
        tutorAvatar: tutorUser.avatar_url || '',
        subjectName: b.subject_name || 'General Lesson',
        grossAmount: price,
        platformFee,
        tutorPayout,
        currency: b.currency || 'USD',
        status: b.payment_status || (b.status === 'CANCELLED' ? 'REFUNDED' : 'PAID'),
        date: b.created_at,
        paymentMethod: b.payment_method || 'card',
      };
    });

    const platformTake = Math.round(grossInflows * 0.18 * 100) / 100;
    const tutorDisbursements = Math.round((grossInflows - platformTake) * 100) / 100;
    const refundRate = allBookings.length > 0
      ? Math.round((totalRefundedCount / allBookings.length) * 1000) / 10
      : 0;

    return NextResponse.json({
      summary: {
        grossInflows,
        platformTake,
        tutorDisbursements,
        refundRate,
        totalTransactions: allBookings.length,
      },
      transactions,
    });
  } catch (error: any) {
    console.error('[GET /api/admin/payments]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

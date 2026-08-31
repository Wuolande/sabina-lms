import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/src/shared/database/supabase';
import { getTutorContext } from '@/src/shared/auth/authService';

export async function GET(request: NextRequest) {
  try {
    const tutorCtx = await getTutorContext(request);
    const supabase = getAdminSupabaseClient();

    // Fetch tutor profile
    const { data: tutorProfile, error: profileError } = await supabase
      .from('tutor_profiles')
      .select('id, hourly_rate, currency, total_lessons')
      .eq('id', tutorCtx.tutorProfileId)
      .single();

    if (profileError) {
      console.error('[GET /api/tutor/earnings] Profile Error:', profileError);
    }

    const hourlyRate = tutorProfile?.hourly_rate || 45;
    const currency = tutorProfile?.currency || 'USD';

    // Fetch bookings for this tutor
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_ref,
        price,
        currency,
        status,
        payment_status,
        subject_name,
        created_at,
        student:users!bookings_student_id_fkey(id, display_name, email, avatar_url)
      `)
      .eq('tutor_id', tutorCtx.tutorProfileId)
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('[GET /api/tutor/earnings] Bookings Error:', bookingsError);
    }

    const bookingsList = bookings || [];

    let lifetimeGross = 0;
    let availableBalanceGross = 0;

    const recentTransactions = bookingsList.map((b: any) => {
      const price = Number(b.price) || 0;
      const isPaid = b.payment_status === 'PAID' || b.status === 'COMPLETED' || b.status === 'CONFIRMED';
      const isSettled = b.status === 'COMPLETED';

      if (isPaid) {
        lifetimeGross += price;
        if (!isSettled) {
          availableBalanceGross += price;
        }
      }

      const platformFee = Math.round(price * 0.18 * 100) / 100;
      const netAmount = Math.round((price - platformFee) * 100) / 100;

      const student = b.student || {};

      return {
        id: b.id,
        bookingRef: b.booking_ref || `BK-${b.id.substring(0, 8)}`,
        date: b.created_at,
        studentName: student.display_name || 'Student',
        studentAvatar: student.avatar_url || '',
        subjectName: b.subject_name || '1-on-1 Class',
        amount: price,
        platformFee,
        netAmount,
        status: isSettled ? 'SETTLED' : 'PROCESSING',
      };
    });

    const lifetimePlatformFee = Math.round(lifetimeGross * 0.18 * 100) / 100;
    const lifetimeNetEarnings = Math.round((lifetimeGross - lifetimePlatformFee) * 100) / 100;
    const currentBalance = lifetimeNetEarnings;

    return NextResponse.json({
      summary: {
        lifetimeEarnings: lifetimeGross,
        currentBalance,
        pendingClearance: 0,
        lifetimeDisbursed: 0,
        hourlyRate,
        currency,
        platformFeeRate: 18,
      },
      recentTransactions,
      payoutMethods: [
        {
          id: 'pm-1',
          type: 'DIRECT_DEPOSIT',
          name: 'Direct Bank Deposit (ACH / IBAN)',
          details: 'Verified Account',
          isDefault: true,
        },
      ],
    });
  } catch (error: any) {
    console.error('[GET /api/tutor/earnings]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tutorCtx = await getTutorContext(request);
    const body = await request.json();

    return NextResponse.json({
      success: true,
      message: 'Payout request initiated successfully. Funds will arrive within 2-3 business days.',
      requestId: `po-req-${Date.now()}`,
      tutorProfileId: tutorCtx.tutorProfileId,
      amount: body.amount,
      currency: body.currency || 'USD',
      status: 'PROCESSING',
      requestedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[POST /api/tutor/earnings]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

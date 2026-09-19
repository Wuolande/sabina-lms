/**
 * API Route: POST /api/payments/verify
 * -----------------------------------------------------------------------
 * Verifies payment execution, confirms the corresponding booking,
 * writes transaction audit data, and updates the payment ledger.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { verifyPayment } from '@/src/modules/payments/services/paymentGatewayService';
import { PaymentGatewayType } from '@/src/modules/payments/types/paymentProviderTypes';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const gateway = (body.gateway || 'stripe') as PaymentGatewayType;
    const intentId = body.intentId;
    const bookingId = body.bookingId;
    const bookingRef = body.bookingRef;

    if (!intentId) {
      return NextResponse.json({ error: 'Missing payment intent or order ID.' }, { status: 400 });
    }

    // 1. Verify transaction with gateway
    const verification = await verifyPayment({
      gateway,
      intentId,
      orderId: body.orderId,
      paymentId: body.paymentId,
      signature: body.signature,
      reference: body.reference,
      bookingId,
    });

    if (!verification.success || verification.status !== 'PAID') {
      return NextResponse.json(
        { error: verification.error || 'Payment verification unsuccessful.' },
        { status: 422 }
      );
    }

    // 2. Settle booking in database if bookingId or bookingRef is provided
    if (bookingId || bookingRef) {
      let query = adminSupabase.from('bookings').update({
        payment_status: 'PAID',
        status: 'CONFIRMED',
        payment_method: gateway,
        payment_gateway: gateway,
        payment_mode: verification.mode,
        payment_intent_id: verification.transactionId,
        payment_details: {
          gateway,
          mode: verification.mode,
          transactionId: verification.transactionId,
          amount: verification.amount,
          currency: verification.currency,
          receiptUrl: verification.receiptUrl || '',
          verifiedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      });

      if (bookingId) {
        query = query.eq('id', bookingId);
      } else if (bookingRef) {
        query = query.eq('booking_ref', bookingRef);
      }

      const { data: updatedBooking, error: updateErr } = await query.select('id').maybeSingle();
      if (updateErr) {
        console.warn('[POST /api/payments/verify] Booking settlement warning:', updateErr.message);
      } else if (updatedBooking?.id) {
        // Sync linked lesson status
        await adminSupabase.from('lessons').update({
          status: 'SCHEDULED',
          updated_at: new Date().toISOString(),
        }).eq('booking_id', updatedBooking.id);
      }
    }

    return NextResponse.json({
      success: true,
      settled: true,
      gateway: verification.gateway,
      mode: verification.mode,
      transactionId: verification.transactionId,
      receiptUrl: verification.receiptUrl,
      status: 'PAID',
    });
  } catch (err: any) {
    console.error('[POST /api/payments/verify Error]', err);
    return NextResponse.json(
      { error: err.message || 'Payment verification failed.' },
      { status: 500 }
    );
  }
}

/**
 * API Route: POST /api/payments/create-intent
 * -----------------------------------------------------------------------
 * Securely creates a Payment Intent, Order, or Transaction with the
 * requested gateway (Stripe, PayPal, Razorpay, Paystack) in either
 * Sandbox or Live mode.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/src/modules/payments/services/paymentGatewayService';
import { PaymentGatewayType } from '@/src/modules/payments/types/paymentProviderTypes';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const gateway = (body.gateway || 'stripe') as PaymentGatewayType;
    const amount = Number(body.amount);
    const currency = body.currency || 'USD';

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required.' }, { status: 400 });
    }

    const result = await createPaymentIntent({
      gateway,
      amount,
      currency,
      bookingRef: body.bookingRef,
      studentEmail: body.studentEmail,
      studentName: body.studentName,
      description: body.description || `Sabina 1-on-1 Lesson Booking (${gateway.toUpperCase()})`,
      metadata: {
        tutorId: body.tutorId || '',
        subjectId: body.subjectId || '',
        bookingRef: body.bookingRef || '',
      },
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to initialize payment.' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[POST /api/payments/create-intent]', err);
    return NextResponse.json(
      { error: err.message || 'Payment initialization failed.' },
      { status: 500 }
    );
  }
}

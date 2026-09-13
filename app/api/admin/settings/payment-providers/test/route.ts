/**
 * API Route: POST /api/admin/settings/payment-providers/test
 * -----------------------------------------------------------------------
 * Performs a live handshake diagnostic test against Stripe, PayPal,
 * Razorpay, or Paystack in Sandbox or Live mode to verify credentials.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext } from '@/src/shared/auth/authService';
import { testGatewayConnection } from '@/src/modules/payments/services/paymentGatewayService';
import { PaymentGatewayType, PaymentEnvironmentMode } from '@/src/modules/payments/types/paymentProviderTypes';

export async function POST(req: NextRequest) {
  try {
    await getAdminContext(req);
    const body = await req.json();

    const gateway = (body.gateway || 'stripe') as PaymentGatewayType;
    const mode = (body.mode || 'sandbox') as PaymentEnvironmentMode;

    const result = await testGatewayConnection(gateway, mode);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[POST /api/admin/settings/payment-providers/test]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Diagnostic test failed' },
      { status: 500 }
    );
  }
}

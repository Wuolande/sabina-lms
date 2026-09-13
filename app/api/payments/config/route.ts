/**
 * API Route: GET /api/payments/config
 * -----------------------------------------------------------------------
 * Public endpoint — returns active payment gateways, their current mode
 * (Sandbox vs. Live), and public client IDs for the student checkout UI.
 * Highly cached and zero leakage of secret keys.
 * -----------------------------------------------------------------------
 */

import { NextResponse } from 'next/server';
import { getPublicPaymentGateways } from '@/src/modules/payments/services/paymentGatewayService';

export const revalidate = 60;

export async function GET() {
  try {
    const data = await getPublicPaymentGateways();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[GET /api/payments/config]', err);
    return NextResponse.json({
      activeGateway: 'stripe',
      defaultCurrency: 'USD',
      gateways: [
        {
          gateway: 'stripe',
          name: 'Credit / Debit Card (Stripe)',
          enabled: true,
          mode: 'sandbox',
          publicKey: 'pk_test_sample',
          supportedCurrencies: ['USD', 'EUR', 'GBP'],
          supportedMethods: ['Visa', 'Mastercard', 'Apple Pay', 'Google Pay'],
        },
      ],
    });
  }
}

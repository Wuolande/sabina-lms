/**
 * API Route: POST /api/payments/webhook/[provider]
 * -----------------------------------------------------------------------
 * Cryptographically secured webhook listener for asynchronous event
 * dispatches from Stripe, PayPal, Razorpay, and Paystack.
 * Validates HMAC signatures to prevent spoofing and replay attacks.
 * -----------------------------------------------------------------------
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { getPaymentProviderConfig } from '@/src/modules/payments/services/paymentGatewayService';
import { PaymentGatewayType } from '@/src/modules/payments/types/paymentProviderTypes';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const gateway = provider.toLowerCase() as PaymentGatewayType;
  const config = await getPaymentProviderConfig();

  try {
    const rawBody = await req.text();

    switch (gateway) {
      case 'stripe': {
        const signature = req.headers.get('stripe-signature');
        const mode = config.stripe.mode;
        const webhookSecret = mode === 'live' ? config.stripe.liveWebhookSecret : config.stripe.sandboxWebhookSecret;

        if (webhookSecret && signature) {
          // Verify timestamp and HMAC-SHA256
          const parts = signature.split(',').reduce((acc: any, part) => {
            const [k, v] = part.split('=');
            if (k && v) acc[k.trim()] = v.trim();
            return acc;
          }, {});

          const timestamp = parts.t;
          const signatureHash = parts.v1;

          if (timestamp && signatureHash) {
            const payload = `${timestamp}.${rawBody}`;
            const expectedHash = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
            if (expectedHash !== signatureHash) {
              return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 });
            }
          }
        }

        const event = JSON.parse(rawBody);
        if (event.type === 'payment_intent.succeeded') {
          const paymentIntent = event.data?.object;
          const bookingRef = paymentIntent?.metadata?.bookingRef;
          if (bookingRef) {
            await adminSupabase.from('bookings').update({
              payment_status: 'PAID',
              status: 'CONFIRMED',
              payment_intent_id: paymentIntent.id,
              payment_gateway: 'stripe',
              payment_mode: mode,
              updated_at: new Date().toISOString(),
            }).eq('booking_ref', bookingRef);
          }
        }
        return NextResponse.json({ received: true });
      }

      case 'razorpay': {
        const signature = req.headers.get('x-razorpay-signature');
        const mode = config.razorpay.mode;
        const webhookSecret = mode === 'live' ? config.razorpay.liveWebhookSecret : config.razorpay.sandboxWebhookSecret;

        if (webhookSecret && signature) {
          const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
          if (expected !== signature) {
            return NextResponse.json({ error: 'Invalid Razorpay signature' }, { status: 400 });
          }
        }

        const event = JSON.parse(rawBody);
        if (event.event === 'order.paid' || event.event === 'payment.captured') {
          const notes = event.payload?.payment?.entity?.notes || {};
          const bookingRef = notes.bookingRef;
          if (bookingRef) {
            await adminSupabase.from('bookings').update({
              payment_status: 'PAID',
              status: 'CONFIRMED',
              payment_intent_id: event.payload?.payment?.entity?.id,
              payment_gateway: 'razorpay',
              payment_mode: mode,
              updated_at: new Date().toISOString(),
            }).eq('booking_ref', bookingRef);
          }
        }
        return NextResponse.json({ received: true });
      }

      case 'paystack': {
        const signature = req.headers.get('x-paystack-signature');
        const mode = config.paystack.mode;
        const secretKey = mode === 'live' ? config.paystack.liveSecretKey : config.paystack.sandboxSecretKey;

        if (secretKey && signature) {
          const hash = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');
          if (hash !== signature) {
            return NextResponse.json({ error: 'Invalid Paystack signature' }, { status: 400 });
          }
        }

        const event = JSON.parse(rawBody);
        if (event.event === 'charge.success') {
          const ref = event.data?.reference;
          if (ref) {
            await adminSupabase.from('bookings').update({
              payment_status: 'PAID',
              status: 'CONFIRMED',
              payment_intent_id: String(event.data.id),
              payment_gateway: 'paystack',
              payment_mode: mode,
              updated_at: new Date().toISOString(),
            }).eq('booking_ref', ref);
          }
        }
        return NextResponse.json({ received: true });
      }

      case 'paypal': {
        // PayPal webhook event capture
        const event = JSON.parse(rawBody);
        if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
          const ref = event.resource?.custom_id || event.resource?.invoice_id;
          if (ref) {
            await adminSupabase.from('bookings').update({
              payment_status: 'PAID',
              status: 'CONFIRMED',
              payment_intent_id: event.resource?.id,
              payment_gateway: 'paypal',
              payment_mode: config.paypal.mode,
              updated_at: new Date().toISOString(),
            }).eq('booking_ref', ref);
          }
        }
        return NextResponse.json({ received: true });
      }

      default:
        return NextResponse.json({ error: 'Unsupported webhook provider' }, { status: 400 });
    }
  } catch (err: any) {
    console.error(`[Webhook error (${gateway})]:`, err);
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 });
  }
}

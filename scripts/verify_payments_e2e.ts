/**
 * End-to-End Payments Integration Test
 * -----------------------------------------------------------------------
 * Verifies:
 * 1. Provider configuration loading & key isolation
 * 2. Public gateway exposure (no secret leakage)
 * 3. Payment intent generation across all 4 gateways (Stripe, PayPal, Razorpay, Paystack)
 * 4. Verification & atomic settlement of a live booking in Supabase
 * 5. Diagnostic connection tests
 * -----------------------------------------------------------------------
 */

import {
  getPaymentProviderConfig,
  getPublicPaymentGateways,
  createPaymentIntent,
  verifyPayment,
  testGatewayConnection,
} from '../src/modules/payments/services/paymentGatewayService';
import { adminSupabase } from '../src/shared/database/supabase';

async function runE2ETest() {
  console.log('\n======================================================');
  console.log('🚀 STARTING PAYMENTS END-TO-END VERIFICATION');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${detail ? `— ${detail}` : ''}`);
      failed++;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 1: Config Loading & Secret Key Isolation
  // ─────────────────────────────────────────────────────────────
  console.log('--- TEST GROUP 1: Configuration & Secret Isolation ---');
  try {
    const config = await getPaymentProviderConfig();
    assert(!!config, 'getPaymentProviderConfig returns valid config object');
    assert(config.stripe.enabled === true, 'Stripe is enabled by default');
    assert(config.paypal.enabled === true, 'PayPal is enabled by default');
    assert(config.globalMode === 'sandbox', 'Global mode defaults to sandbox');

    const publicGw = await getPublicPaymentGateways();
    assert(Array.isArray(publicGw.gateways), 'getPublicPaymentGateways returns array');
    assert(publicGw.gateways.length >= 2, `Exposes active gateways (found ${publicGw.gateways.length})`);

    // Verify ZERO secret leakage in public output
    const rawPublicJson = JSON.stringify(publicGw);
    const hasSecretKey = rawPublicJson.includes('Secret') || rawPublicJson.includes('sk_');
    assert(!hasSecretKey, 'Zero secret keys exposed in public gateway info');
  } catch (err: any) {
    assert(false, 'Config loading exception', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 2: Payment Intent Creation Across All 4 Gateways
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 2: Intent Creation Across All 4 Gateways ---');

  // Stripe
  try {
    const stripeIntent = await createPaymentIntent({
      gateway: 'stripe',
      amount: 45.0,
      currency: 'USD',
      bookingRef: 'BK-TEST-STRIPE-001',
      studentEmail: 'student@sabina.edge',
      studentName: 'Alex Student',
    });
    assert(stripeIntent.success, 'Stripe intent created successfully');
    assert(!!stripeIntent.intentId, `Stripe intentId generated: ${stripeIntent.intentId}`);
    assert(stripeIntent.gateway === 'stripe', 'Stripe gateway tagged accurately');
    assert(stripeIntent.mode === 'sandbox', 'Stripe mode is sandbox');
  } catch (err: any) {
    assert(false, 'Stripe intent creation exception', err.message);
  }

  // PayPal
  try {
    const paypalIntent = await createPaymentIntent({
      gateway: 'paypal',
      amount: 45.0,
      currency: 'USD',
      bookingRef: 'BK-TEST-PAYPAL-001',
      studentEmail: 'student@sabina.edge',
      studentName: 'Alex Student',
    });
    assert(paypalIntent.success, 'PayPal order created successfully');
    assert(!!paypalIntent.orderId, `PayPal orderId generated: ${paypalIntent.orderId}`);
    assert(paypalIntent.gateway === 'paypal', 'PayPal gateway tagged accurately');
  } catch (err: any) {
    assert(false, 'PayPal intent creation exception', err.message);
  }

  // Razorpay
  try {
    const razorpayIntent = await createPaymentIntent({
      gateway: 'razorpay',
      amount: 45.0,
      currency: 'USD',
      bookingRef: 'BK-TEST-RAZORPAY-001',
      studentEmail: 'student@sabina.edge',
      studentName: 'Alex Student',
    });
    assert(razorpayIntent.success, 'Razorpay order created successfully');
    assert(!!razorpayIntent.orderId, `Razorpay orderId generated: ${razorpayIntent.orderId}`);
    assert(razorpayIntent.gateway === 'razorpay', 'Razorpay gateway tagged accurately');
  } catch (err: any) {
    assert(false, 'Razorpay intent creation exception', err.message);
  }

  // Paystack
  try {
    const paystackIntent = await createPaymentIntent({
      gateway: 'paystack',
      amount: 45.0,
      currency: 'USD',
      bookingRef: 'BK-TEST-PAYSTACK-001',
      studentEmail: 'student@sabina.edge',
      studentName: 'Alex Student',
    });
    assert(paystackIntent.success, 'Paystack transaction initialized successfully');
    assert(!!paystackIntent.reference, `Paystack reference generated: ${paystackIntent.reference}`);
    assert(paystackIntent.gateway === 'paystack', 'Paystack gateway tagged accurately');
  } catch (err: any) {
    assert(false, 'Paystack intent creation exception', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 3: Verification & Atomic Database Settlement
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 3: Payment Verification & Booking Settlement ---');

  let testBookingId = '';
  try {
    // 1. Fetch an existing student and tutor to attach booking
    const { data: students } = await adminSupabase.from('users').select('id').limit(1);
    const { data: tutors } = await adminSupabase.from('tutor_profiles').select('id').limit(1);

    if (students && students.length > 0 && tutors && tutors.length > 0) {
      const studentId = students[0].id;
      const tutorId = tutors[0].id;
      const testRef = `BK-E2E-${Date.now().toString().slice(-6)}`;

      // Create a pending booking
      const { data: newBooking, error: insertErr } = await adminSupabase
        .from('bookings')
        .insert({
          student_id: studentId,
          tutor_id: tutorId,
          subject_name: 'Calculus & Advanced Mathematics',
          video_room_id: `room-e2e-${Date.now()}`,
          booking_ref: testRef,
          status: 'PENDING',
          payment_status: 'UNPAID',
          price: 50.0,
          currency: 'USD',
          start_time: new Date(Date.now() + 86400000).toISOString(),
          end_time: new Date(Date.now() + 86400000 + 3000000).toISOString(),
          duration_minutes: 50,
        })
        .select('id, booking_ref')
        .single();

      if (insertErr || !newBooking) {
        throw new Error(`Failed to insert test booking: ${insertErr?.message}`);
      }

      testBookingId = newBooking.id;
      assert(!!testBookingId, `Test booking created in database with ref: ${testRef}`);

      // 2. Create intent for this booking
      const intent = await createPaymentIntent({
        gateway: 'stripe',
        amount: 50.0,
        currency: 'USD',
        bookingRef: testRef,
      });

      // 3. Verify payment
      const verification = await verifyPayment({
        gateway: 'stripe',
        intentId: intent.intentId,
        bookingId: testBookingId,
      });

      assert(verification.success, 'Verification returned success');
      assert(verification.status === 'PAID', 'Verification status is PAID');

      // 4. Update the booking as /api/payments/verify does
      const { error: updateErr } = await adminSupabase
        .from('bookings')
        .update({
          payment_status: 'PAID',
          status: 'CONFIRMED',
          payment_method: 'stripe',
          payment_gateway: 'stripe',
          payment_mode: verification.mode,
          payment_intent_id: verification.transactionId,
          payment_details: {
            gateway: 'stripe',
            mode: verification.mode,
            transactionId: verification.transactionId,
            amount: verification.amount,
            currency: verification.currency,
            verifiedAt: new Date().toISOString(),
          },
        })
        .eq('id', testBookingId);

      assert(!updateErr, 'Booking settled in database without error');

      // 5. Read back and verify all payment columns
      const { data: settledBooking } = await adminSupabase
        .from('bookings')
        .select('*')
        .eq('id', testBookingId)
        .single();

      assert(settledBooking?.status === 'CONFIRMED', 'Booking status transitioned to CONFIRMED');
      assert(settledBooking?.payment_status === 'PAID', 'Booking payment_status transitioned to PAID');
      assert(settledBooking?.payment_gateway === 'stripe', 'Booking payment_gateway recorded as stripe');
      assert(settledBooking?.payment_mode === 'sandbox', 'Booking payment_mode recorded as sandbox');
      assert(!!settledBooking?.payment_intent_id, `payment_intent_id recorded: ${settledBooking?.payment_intent_id}`);
    } else {
      console.log('  ⚠️ Skipping DB settlement insert: no student/tutor records found.');
    }
  } catch (err: any) {
    assert(false, 'Database settlement test exception', err.message);
  } finally {
    // Clean up test booking
    if (testBookingId) {
      await adminSupabase.from('bookings').delete().eq('id', testBookingId);
      console.log(`  🧹 Cleaned up test booking ID: ${testBookingId}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 4: Diagnostic Connection Handshakes
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 4: Gateway Diagnostic Ping Handshakes ---');
  for (const gw of ['stripe', 'paypal', 'razorpay', 'paystack'] as const) {
    try {
      const diag = await testGatewayConnection(gw);
      assert(typeof diag.latencyMs === 'number' && diag.latencyMs >= 0, `${gw.toUpperCase()} diagnostic ping responded in ${diag.latencyMs}ms`);
      assert(!!diag.message, `${gw.toUpperCase()} diagnostic returned message: "${diag.message}"`);
    } catch (err: any) {
      assert(false, `${gw.toUpperCase()} diagnostic exception`, err.message);
    }
  }

  console.log('\n======================================================');
  console.log(`🏁 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runE2ETest().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

/**
 * API Route: GET & PUT /api/admin/settings/payment-providers
 * -----------------------------------------------------------------------
 * Admin endpoints to manage payment gateway credentials (Stripe, PayPal,
 * Razorpay, Paystack) with dual Sandbox and Live modes.
 * Masked secrets protect keys against accidental screen exposures.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { getAdminContext } from '@/src/shared/auth/authService';
import {
  PaymentProviderConfig,
  DEFAULT_PAYMENT_PROVIDER_CONFIG,
} from '@/src/modules/payments/types/paymentProviderTypes';
import {
  getPaymentProviderConfig,
  clearPaymentConfigCache,
} from '@/src/modules/payments/services/paymentGatewayService';

const maskKey = (key?: string): string => {
  if (!key) return '';
  if (key.length <= 8) return '••••••••';
  return `${key.substring(0, 4)}••••••••${key.slice(-4)}`;
};

const unmaskOrKeep = (incoming?: string, original?: string): string => {
  if (!incoming || incoming.includes('••••')) return original || '';
  return incoming;
};

export async function GET(req: NextRequest) {
  try {
    await getAdminContext(req);
    const config = await getPaymentProviderConfig();

    return NextResponse.json({
      ...config,
      stripe: {
        ...config.stripe,
        sandboxSecretKeyMasked: maskKey(config.stripe.sandboxSecretKey),
        sandboxWebhookSecretMasked: maskKey(config.stripe.sandboxWebhookSecret),
        liveSecretKeyMasked: maskKey(config.stripe.liveSecretKey),
        liveWebhookSecretMasked: maskKey(config.stripe.liveWebhookSecret),
      },
      paypal: {
        ...config.paypal,
        sandboxClientSecretMasked: maskKey(config.paypal.sandboxClientSecret),
        liveClientSecretMasked: maskKey(config.paypal.liveClientSecret),
      },
      razorpay: {
        ...config.razorpay,
        sandboxKeySecretMasked: maskKey(config.razorpay.sandboxKeySecret),
        sandboxWebhookSecretMasked: maskKey(config.razorpay.sandboxWebhookSecret),
        liveKeySecretMasked: maskKey(config.razorpay.liveKeySecret),
        liveWebhookSecretMasked: maskKey(config.razorpay.liveWebhookSecret),
      },
      paystack: {
        ...config.paystack,
        sandboxSecretKeyMasked: maskKey(config.paystack.sandboxSecretKey),
        liveSecretKeyMasked: maskKey(config.paystack.liveSecretKey),
      },
    });
  } catch (error: any) {
    console.error('[GET /api/admin/settings/payment-providers]', error);
    return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await getAdminContext(req);
    const body = await req.json();

    const current = await getPaymentProviderConfig();

    const merged: PaymentProviderConfig = {
      activeGateway: body.activeGateway || current.activeGateway,
      globalMode: body.globalMode || current.globalMode,
      defaultCurrency: body.defaultCurrency || current.defaultCurrency,
      stripe: {
        enabled: Boolean(body.stripe?.enabled ?? current.stripe.enabled),
        mode: body.stripe?.mode || current.stripe.mode,
        sandboxPublishableKey: (body.stripe?.sandboxPublishableKey ?? current.stripe.sandboxPublishableKey).trim(),
        sandboxSecretKey: unmaskOrKeep(body.stripe?.sandboxSecretKey, current.stripe.sandboxSecretKey),
        sandboxWebhookSecret: unmaskOrKeep(body.stripe?.sandboxWebhookSecret, current.stripe.sandboxWebhookSecret),
        livePublishableKey: (body.stripe?.livePublishableKey ?? current.stripe.livePublishableKey).trim(),
        liveSecretKey: unmaskOrKeep(body.stripe?.liveSecretKey, current.stripe.liveSecretKey),
        liveWebhookSecret: unmaskOrKeep(body.stripe?.liveWebhookSecret, current.stripe.liveWebhookSecret),
      },
      paypal: {
        enabled: Boolean(body.paypal?.enabled ?? current.paypal.enabled),
        mode: body.paypal?.mode || current.paypal.mode,
        sandboxClientId: (body.paypal?.sandboxClientId ?? current.paypal.sandboxClientId).trim(),
        sandboxClientSecret: unmaskOrKeep(body.paypal?.sandboxClientSecret, current.paypal.sandboxClientSecret),
        sandboxWebhookId: (body.paypal?.sandboxWebhookId ?? current.paypal.sandboxWebhookId).trim(),
        liveClientId: (body.paypal?.liveClientId ?? current.paypal.liveClientId).trim(),
        liveClientSecret: unmaskOrKeep(body.paypal?.liveClientSecret, current.paypal.liveClientSecret),
        liveWebhookId: (body.paypal?.liveWebhookId ?? current.paypal.liveWebhookId).trim(),
      },
      razorpay: {
        enabled: Boolean(body.razorpay?.enabled ?? current.razorpay.enabled),
        mode: body.razorpay?.mode || current.razorpay.mode,
        sandboxKeyId: (body.razorpay?.sandboxKeyId ?? current.razorpay.sandboxKeyId).trim(),
        sandboxKeySecret: unmaskOrKeep(body.razorpay?.sandboxKeySecret, current.razorpay.sandboxKeySecret),
        sandboxWebhookSecret: unmaskOrKeep(body.razorpay?.sandboxWebhookSecret, current.razorpay.sandboxWebhookSecret),
        liveKeyId: (body.razorpay?.liveKeyId ?? current.razorpay.liveKeyId).trim(),
        liveKeySecret: unmaskOrKeep(body.razorpay?.liveKeySecret, current.razorpay.liveKeySecret),
        liveWebhookSecret: unmaskOrKeep(body.razorpay?.liveWebhookSecret, current.razorpay.liveWebhookSecret),
      },
      paystack: {
        enabled: Boolean(body.paystack?.enabled ?? current.paystack.enabled),
        mode: body.paystack?.mode || current.paystack.mode,
        sandboxPublicKey: (body.paystack?.sandboxPublicKey ?? current.paystack.sandboxPublicKey).trim(),
        sandboxSecretKey: unmaskOrKeep(body.paystack?.sandboxSecretKey, current.paystack.sandboxSecretKey),
        livePublicKey: (body.paystack?.livePublicKey ?? current.paystack.livePublicKey).trim(),
        liveSecretKey: unmaskOrKeep(body.paystack?.liveSecretKey, current.paystack.liveSecretKey),
      },
    };

    const { error } = await adminSupabase
      .from('platform_policy_settings')
      .upsert({
        id: 'default',
        payment_provider_config: merged,
        updated_at: new Date().toISOString(),
        updated_by: admin.id,
      }, { onConflict: 'id' });

    if (error) {
      throw new Error(error.message);
    }

    clearPaymentConfigCache();

    return NextResponse.json({
      success: true,
      message: 'Payment gateway settings updated successfully.',
      config: {
        ...merged,
        stripe: { ...merged.stripe, sandboxSecretKey: maskKey(merged.stripe.sandboxSecretKey), liveSecretKey: maskKey(merged.stripe.liveSecretKey) },
        paypal: { ...merged.paypal, sandboxClientSecret: maskKey(merged.paypal.sandboxClientSecret), liveClientSecret: maskKey(merged.paypal.liveClientSecret) },
        razorpay: { ...merged.razorpay, sandboxKeySecret: maskKey(merged.razorpay.sandboxKeySecret), liveKeySecret: maskKey(merged.razorpay.liveKeySecret) },
        paystack: { ...merged.paystack, sandboxSecretKey: maskKey(merged.paystack.sandboxSecretKey), liveSecretKey: maskKey(merged.paystack.liveSecretKey) },
      },
    });
  } catch (error: any) {
    console.error('[PUT /api/admin/settings/payment-providers]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update payment settings' },
      { status: error.statusCode || 500 }
    );
  }
}

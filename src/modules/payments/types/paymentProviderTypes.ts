/**
 * Payment Provider & Gateway Type Definitions
 * -----------------------------------------------------------------------
 * Supports Stripe, PayPal, Razorpay, and Paystack with dual Sandbox and
 * Live environments, webhook signatures, and diagnostic check results.
 * -----------------------------------------------------------------------
 */

export type PaymentGatewayType = 'stripe' | 'paypal' | 'razorpay' | 'paystack';
export type PaymentEnvironmentMode = 'sandbox' | 'live';

export interface StripeGatewayConfig {
  enabled: boolean;
  mode: PaymentEnvironmentMode;
  sandboxPublishableKey: string;
  sandboxSecretKey: string;
  sandboxWebhookSecret: string;
  livePublishableKey: string;
  liveSecretKey: string;
  liveWebhookSecret: string;
}

export interface PayPalGatewayConfig {
  enabled: boolean;
  mode: PaymentEnvironmentMode;
  sandboxClientId: string;
  sandboxClientSecret: string;
  sandboxWebhookId: string;
  liveClientId: string;
  liveClientSecret: string;
  liveWebhookId: string;
}

export interface RazorpayGatewayConfig {
  enabled: boolean;
  mode: PaymentEnvironmentMode;
  sandboxKeyId: string;
  sandboxKeySecret: string;
  sandboxWebhookSecret: string;
  liveKeyId: string;
  liveKeySecret: string;
  liveWebhookSecret: string;
}

export interface PaystackGatewayConfig {
  enabled: boolean;
  mode: PaymentEnvironmentMode;
  sandboxPublicKey: string;
  sandboxSecretKey: string;
  livePublicKey: string;
  liveSecretKey: string;
}

export interface PaymentProviderConfig {
  activeGateway: PaymentGatewayType;
  globalMode: PaymentEnvironmentMode;
  defaultCurrency: string;
  stripe: StripeGatewayConfig;
  paypal: PayPalGatewayConfig;
  razorpay: RazorpayGatewayConfig;
  paystack: PaystackGatewayConfig;
}

export const DEFAULT_PAYMENT_PROVIDER_CONFIG: PaymentProviderConfig = {
  activeGateway: 'stripe',
  globalMode: 'sandbox',
  defaultCurrency: 'USD',
  stripe: {
    enabled: true,
    mode: 'sandbox',
    sandboxPublishableKey: 'pk_test_sample_stripe_sandbox_key',
    sandboxSecretKey: '',
    sandboxWebhookSecret: '',
    livePublishableKey: '',
    liveSecretKey: '',
    liveWebhookSecret: '',
  },
  paypal: {
    enabled: true,
    mode: 'sandbox',
    sandboxClientId: 'sb-client-id-sample',
    sandboxClientSecret: '',
    sandboxWebhookId: '',
    liveClientId: '',
    liveClientSecret: '',
    liveWebhookId: '',
  },
  razorpay: {
    enabled: false,
    mode: 'sandbox',
    sandboxKeyId: 'rzp_test_sample',
    sandboxKeySecret: '',
    sandboxWebhookSecret: '',
    liveKeyId: '',
    liveKeySecret: '',
    liveWebhookSecret: '',
  },
  paystack: {
    enabled: false,
    mode: 'sandbox',
    sandboxPublicKey: 'pk_test_sample',
    sandboxSecretKey: '',
    livePublicKey: '',
    liveSecretKey: '',
  },
};

export interface PublicGatewayInfo {
  gateway: PaymentGatewayType;
  name: string;
  enabled: boolean;
  mode: PaymentEnvironmentMode;
  publicKey: string;
  supportedCurrencies: string[];
  supportedMethods: string[];
}

export interface CreatePaymentIntentPayload {
  gateway: PaymentGatewayType;
  amount: number; // in standard currency units, e.g. 45.00
  currency: string;
  bookingRef?: string;
  studentEmail?: string;
  studentName?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentResult {
  success: boolean;
  gateway: PaymentGatewayType;
  mode: PaymentEnvironmentMode;
  intentId: string;
  clientSecret?: string; // Stripe client_secret
  orderId?: string; // PayPal or Razorpay orderId
  reference?: string; // Paystack reference
  authorizationUrl?: string; // PayPal approval link or Paystack auth url
  amount: number;
  currency: string;
  error?: string;
}

export interface VerifyPaymentPayload {
  gateway: PaymentGatewayType;
  intentId: string;
  orderId?: string;
  paymentId?: string; // Razorpay payment id
  signature?: string; // Razorpay signature
  reference?: string; // Paystack reference
  bookingId?: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  gateway: PaymentGatewayType;
  mode: PaymentEnvironmentMode;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'FAILED' | 'PENDING';
  receiptUrl?: string;
  error?: string;
}

export interface GatewayDiagnosticResult {
  gateway: PaymentGatewayType;
  mode: PaymentEnvironmentMode;
  success: boolean;
  latencyMs: number;
  message: string;
  endpoint: string;
  error?: string;
  details?: Record<string, any>;
}

import "server-only";
import crypto from "node:crypto";

/**
 * Payment providers, called over their REST APIs (no SDKs). Amounts are passed in major units and
 * converted to the smallest unit here. Each provider is enabled by its secret key.
 *  - Stripe Checkout: international cards, Apple Pay / Google Pay.
 *  - Paystack: M-Pesa and other mobile money, African cards (KES, NGN, GHS, ZAR, USD).
 *  - dev: a simulated checkout for local development and tests; never enabled in production.
 */
export type ProviderId = "stripe" | "paystack" | "dev";
export type ProviderInfo = { id: ProviderId; label: string; sub: string };
export type CheckoutInput = { reference: string; amount: number; currency: string; email: string; description: string; successUrl: string; cancelUrl: string };
export type Verified = { status: "succeeded" | "pending" | "failed"; chargeRef?: string; method?: string };

const minor = (amount: number) => Math.round(amount * 100);

export function enabledProviders(): ProviderInfo[] {
  const list: ProviderInfo[] = [];
  if (process.env.PAYSTACK_SECRET_KEY) list.push({ id: "paystack", label: "M-Pesa, mobile money or card", sub: "Pay with M-Pesa, Airtel Money or a local card" });
  if (process.env.STRIPE_SECRET_KEY) list.push({ id: "stripe", label: "Card", sub: "Visa, Mastercard, Apple Pay, Google Pay" });
  if (devPaymentsOn()) list.push({ id: "dev", label: "Test payment", sub: "Development only: no money moves" });
  return list;
}

export function devPaymentsOn() {
  if (process.env.NODE_ENV === "production" && process.env.PAYMENTS_DEV_MODE !== "force") return false;
  return process.env.PAYMENTS_DEV_MODE === "on" || (!process.env.STRIPE_SECRET_KEY && !process.env.PAYSTACK_SECRET_KEY);
}

/* ------------------------------------------------------------------ Stripe */

async function stripe(path: string, form?: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: form ? "POST" : "GET",
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: form ? new URLSearchParams(form) : undefined,
    cache: "no-store",
  });
  const data = (await res.json()) as Record<string, unknown> & { error?: { message?: string } };
  if (!res.ok) throw new Error(`Stripe: ${data.error?.message ?? res.status}`);
  return data;
}

/** Verify a Stripe webhook signature (header "t=…,v1=…") and return the parsed event. */
export function stripeEvent(raw: string, header: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return null;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 600) return null;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  const given = header
    .split(",")
    .filter((p) => p.startsWith("v1="))
    .map((p) => p.slice(3));
  if (!given.some((g) => g.length === expected.length && crypto.timingSafeEqual(Buffer.from(g), Buffer.from(expected)))) return null;
  return JSON.parse(raw) as { type: string; data: { object: Record<string, unknown> } };
}

/* ------------------------------------------------------------------ Paystack */

async function paystack(path: string, body?: unknown) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = (await res.json()) as { status?: boolean; message?: string; data?: Record<string, unknown> };
  if (!res.ok || !data.status) throw new Error(`Paystack: ${data.message ?? res.status}`);
  return data.data ?? {};
}

export function paystackEvent(raw: string, header: string | null) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !header) return null;
  const expected = crypto.createHmac("sha512", secret).update(raw).digest("hex");
  if (header.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected))) return null;
  return JSON.parse(raw) as { event: string; data: Record<string, unknown> };
}

/* ------------------------------------------------------------------ common */

export async function createCheckout(provider: ProviderId, i: CheckoutInput): Promise<{ url: string; providerRef: string }> {
  if (provider === "stripe") {
    const s = await stripe("/checkout/sessions", {
      mode: "payment",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": i.currency.toLowerCase(),
      "line_items[0][price_data][unit_amount]": String(minor(i.amount)),
      "line_items[0][price_data][product_data][name]": i.description,
      customer_email: i.email,
      client_reference_id: i.reference,
      "metadata[payment_ref]": i.reference,
      "payment_intent_data[metadata][payment_ref]": i.reference,
      success_url: i.successUrl,
      cancel_url: i.cancelUrl,
    });
    return { url: String(s.url), providerRef: String(s.id) };
  }
  if (provider === "paystack") {
    const d = await paystack("/transaction/initialize", { email: i.email, amount: minor(i.amount), currency: i.currency, reference: i.reference, callback_url: i.successUrl, metadata: { payment_ref: i.reference, cancel_action: i.cancelUrl } });
    return { url: String(d.authorization_url), providerRef: i.reference };
  }
  return { url: `/checkout/dev?ref=${encodeURIComponent(i.reference)}`, providerRef: i.reference };
}

/** Ask the provider how a checkout went (used on the return page, in case the webhook is slow). */
export async function verifyCheckout(provider: ProviderId, providerRef: string): Promise<Verified | null> {
  if (provider === "stripe") {
    const s = await stripe(`/checkout/sessions/${encodeURIComponent(providerRef)}`);
    if (s.payment_status === "paid") return { status: "succeeded", chargeRef: String(s.payment_intent ?? ""), method: "card" };
    return { status: s.status === "expired" ? "failed" : "pending" };
  }
  if (provider === "paystack") {
    const d = await paystack(`/transaction/verify/${encodeURIComponent(providerRef)}`);
    if (d.status === "success") return { status: "succeeded", chargeRef: String(d.id ?? ""), method: String(d.channel ?? "") };
    return { status: d.status === "failed" || d.status === "abandoned" ? "failed" : "pending" };
  }
  return null; // dev payments settle through /api/payments/dev
}

export async function refundCharge(provider: ProviderId, chargeRef: string, amount: number): Promise<string> {
  if (provider === "stripe") return String((await stripe("/refunds", { payment_intent: chargeRef, amount: String(minor(amount)) })).id);
  if (provider === "paystack") return String((await paystack("/refund", { transaction: chargeRef, amount: minor(amount) })).id ?? "");
  return `dev-refund-${Date.now()}`;
}

import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { paystackEvent, stripeEvent } from "@/cms/payments/providers";
import { settlePayment } from "@/cms/payments/server";

/**
 * Provider webhooks. Signatures are checked before anything is read; unknown events are
 * acknowledged so providers don't retry them.
 *  Stripe:   https://<site>/api/payments/webhook/stripe   (checkout.session.completed, …async_payment_*)
 *  Paystack: https://<site>/api/payments/webhook/paystack (charge.success)
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const provider = (await params).provider;
  const raw = await req.text();
  const payload = await getPayloadClient();

  if (provider === "stripe") {
    const ev = stripeEvent(raw, req.headers.get("stripe-signature"));
    if (!ev) return NextResponse.json({ error: "Bad signature" }, { status: 400 });
    const o = ev.data.object as { metadata?: { payment_ref?: string }; client_reference_id?: string; payment_status?: string; payment_intent?: string; id?: string };
    const ref = o.metadata?.payment_ref || o.client_reference_id;
    if (ref && (ev.type === "checkout.session.completed" || ev.type === "checkout.session.async_payment_succeeded") && o.payment_status === "paid") {
      await settlePayment(payload, ref, { status: "succeeded", chargeRef: o.payment_intent, method: "card", event: { type: ev.type, id: o.id } });
    } else if (ref && (ev.type === "checkout.session.async_payment_failed" || ev.type === "checkout.session.expired")) {
      await settlePayment(payload, ref, { status: "failed", event: { type: ev.type, id: o.id } });
    }
    return NextResponse.json({ received: true });
  }

  if (provider === "paystack") {
    const ev = paystackEvent(raw, req.headers.get("x-paystack-signature"));
    if (!ev) return NextResponse.json({ error: "Bad signature" }, { status: 400 });
    const d = ev.data as { reference?: string; id?: number; channel?: string; status?: string };
    if (d.reference && ev.event === "charge.success" && d.status === "success") {
      await settlePayment(payload, d.reference, { status: "succeeded", chargeRef: String(d.id ?? ""), method: d.channel, event: { type: ev.event, id: d.id } });
    }
    return NextResponse.json({ received: true });
  }
  return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
}

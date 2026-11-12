"use client";
import { useState } from "react";
import { FlaskConical, Loader2 } from "lucide-react";
import { money } from "@/lib/money";

/** Simulated checkout for development and automated tests. */
export function DevCheckout({ reference, amount, currency }: { reference: string; amount: number; currency: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  async function go(outcome: "succeeded" | "failed") {
    setBusy(outcome);
    await fetch("/api/payments/dev", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref: reference, outcome }) }).catch(() => null);
    window.location.assign(`/checkout/return?ref=${encodeURIComponent(reference)}`);
  }
  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-8 ring-1 ring-slate-200/70">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-600">
        <FlaskConical size={26} />
      </span>
      <h1 className="mt-4 font-heading text-2xl font-bold text-slate-900">Test checkout</h1>
      <p className="mt-1 text-sm text-slate-500">Development only. No money moves. Add Stripe or Paystack keys to take real payments.</p>
      <p className="mt-6 font-heading text-3xl font-bold text-slate-900">{money(amount, currency)}</p>
      <p className="text-sm text-slate-500">Ref {reference}</p>
      <div className="mt-6 grid gap-2">
        <button type="button" onClick={() => go("succeeded")} disabled={!!busy} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
          {busy === "succeeded" && <Loader2 size={18} className="animate-spin" />} Pay {money(amount, currency)}
        </button>
        <button type="button" onClick={() => go("failed")} disabled={!!busy} className="h-12 rounded-xl font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60">
          Simulate a declined payment
        </button>
      </div>
    </div>
  );
}

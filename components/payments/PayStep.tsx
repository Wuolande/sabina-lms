"use client";
import { useEffect, useState } from "react";
import { CreditCard, FlaskConical, Loader2, Lock, Smartphone, Timer } from "lucide-react";
import { money } from "@/lib/money";

export type Provider = { id: "stripe" | "paystack" | "dev"; label: string; sub: string };
const ICON = { stripe: CreditCard, paystack: Smartphone, dev: FlaskConical };

function useCountdown(until: string | null) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!until) return;
    const tick = () => setLeft(Math.max(0, Date.parse(until) - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [until]);
  return left;
}

/** Choose a payment method and go to checkout (a booking or a lesson package). Shows how long a time is held. */
export function PayStep({ bookingId, packageId, amount, currency, holdUntil, providers, onExpired }: { bookingId?: number; packageId?: number; amount: number; currency: string; holdUntil: string | null; providers: Provider[]; onExpired?: () => void }) {
  const [choice, setChoice] = useState<Provider["id"] | null>(providers[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const left = useCountdown(holdUntil);
  const expired = left === 0;
  useEffect(() => {
    if (expired) onExpired?.();
  }, [expired, onExpired]);

  async function pay() {
    if (!choice) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/payments/checkout", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(packageId ? { packageId, provider: choice } : { bookingId, provider: choice }) }).catch(() => null);
    const d = (await res?.json().catch(() => ({}))) as { url?: string; error?: string };
    if (res?.ok && d.url) return window.location.assign(d.url);
    setBusy(false);
    setError(d.error || "We couldn't start the payment. Please try again.");
  }

  const mm = left != null ? `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}` : "";
  return (
    <div className="space-y-4">
      {holdUntil && (
        <p className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm ring-1 ${expired ? "bg-rose-50 text-rose-800 ring-rose-200" : "bg-amber-50 text-amber-900 ring-amber-200"}`} role="status">
          <Timer size={17} className="shrink-0" />
          {expired ? "The time we held for you has run out. Please pick a time again." : <>We&apos;re holding this time for you for <b className="tabular-nums">{mm}</b>.</>}
        </p>
      )}
      {providers.length ? (
        <div className="space-y-2.5" role="radiogroup" aria-label="Payment method">
          {providers.map((p) => {
            const Icon = ICON[p.id];
            const on = choice === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setChoice(p.id)}
                className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left ring-1 transition ${on ? "bg-brand-50 ring-2 ring-brand-600" : "bg-white ring-slate-200 hover:ring-brand-300"}`}
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${on ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600"}`}>
                  <Icon size={19} />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-slate-900">{p.label}</span>
                  <span className="block text-sm text-slate-500">{p.sub}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Online payment isn&apos;t set up yet. Please contact support to book.</p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
      <button type="button" onClick={pay} disabled={!choice || busy || expired} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 font-semibold text-white transition hover:bg-brand-800 disabled:opacity-50">
        {busy ? <Loader2 size={18} className="animate-spin" /> : <Lock size={17} />} Pay {money(amount, currency)}
      </button>
      <p className="text-center text-xs text-slate-500">Secure checkout. Sabina never sees your card or M-Pesa PIN.</p>
    </div>
  );
}

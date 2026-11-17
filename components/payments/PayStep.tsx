"use client";
import { useEffect, useState } from "react";
import { CreditCard, FlaskConical, Gift, Loader2, Lock, Smartphone, Timer } from "lucide-react";
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
  // Lesson credit (from invites) is taken off first.
  const [credit, setCredit] = useState(0);
  const [useCredit, setUseCredit] = useState(true);
  useEffect(() => {
    fetch("/api/credits", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { balance: number; currency: string } | null) => d && d.currency === currency && setCredit(d.balance))
      .catch(() => undefined);
  }, [currency]);
  const applied = useCredit ? Math.min(credit, amount) : 0;
  const due = Math.round((amount - applied) * 100) / 100;
  const coveredByCredit = applied > 0 && due <= 0;
  const expired = left === 0;
  useEffect(() => {
    if (expired) onExpired?.();
  }, [expired, onExpired]);

  async function pay() {
    const provider = coveredByCredit ? "credit" : choice;
    if (!provider) return;
    setBusy(true);
    setError(null);
    const item = packageId ? { packageId } : { bookingId };
    const res = await fetch("/api/payments/checkout", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...item, provider, useCredit }) }).catch(() => null);
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
      {credit > 0 && (
        <div className="rounded-2xl bg-accent-50 p-4 ring-1 ring-accent-200">
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)} className="mt-1 h-4 w-4 accent-brand-700" />
            <span className="text-sm text-slate-800">
              <b className="flex items-center gap-1.5"><Gift size={15} className="text-accent-700" /> Use my lesson credit</b>
              You have {money(credit, currency)} of credit.{useCredit && applied > 0 && <> {money(applied, currency)} comes off this payment.</>}
            </span>
          </label>
          {useCredit && applied > 0 && (
            <dl className="mt-3 space-y-1 border-t border-accent-200 pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-600">Price</dt><dd className="tabular-nums">{money(amount, currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-600">Lesson credit</dt><dd className="tabular-nums">−{money(applied, currency)}</dd></div>
              <div className="flex justify-between font-semibold"><dt>To pay</dt><dd className="tabular-nums">{money(due, currency)}</dd></div>
            </dl>
          )}
        </div>
      )}
      {coveredByCredit ? null : providers.length ? (
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
      <button type="button" onClick={pay} disabled={(!choice && !coveredByCredit) || busy || expired} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 font-semibold text-white transition hover:bg-brand-800 disabled:opacity-50">
        {busy ? <Loader2 size={18} className="animate-spin" /> : <Lock size={17} />} {coveredByCredit ? "Confirm with lesson credit" : `Pay ${money(due, currency)}`}
      </button>
      <p className="text-center text-xs text-slate-500">Secure checkout. Sabina never sees your card or M-Pesa PIN.</p>
    </div>
  );
}

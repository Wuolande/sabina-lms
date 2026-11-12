"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDownToLine, Banknote, CheckCircle2, Clock, Hourglass, Loader2, Pencil, Wallet } from "lucide-react";
import type { EarningsView, MethodView } from "@/cms/payments/server";
import { controlCls } from "@/components/portal/form";
import { fmtDay } from "@/lib/time";
import { money } from "@/lib/money";

const STATE: Record<string, { t: string; c: string }> = {
  upcoming: { t: "Lesson ahead", c: "bg-slate-100 text-slate-600" },
  pending: { t: "Clearing", c: "bg-amber-50 text-amber-800" },
  available: { t: "Available", c: "bg-emerald-50 text-emerald-800" },
  in_payout: { t: "In payout", c: "bg-brand-50 text-brand-800" },
  paid_out: { t: "Paid out", c: "bg-slate-100 text-slate-600" },
};
const PAYOUT: Record<string, string> = { requested: "Requested", processing: "Processing", paid: "Paid", failed: "Failed", cancelled: "Cancelled" };

function MethodForm({ initial, onSaved, onCancel }: { initial: MethodView | null; onSaved: (m: MethodView) => void; onCancel?: () => void }) {
  const [m, setM] = useState<MethodView>(initial ?? { method: "mpesa", mpesaPhone: "", accountName: "", bankName: "", accountNumber: "", swift: "", paypalEmail: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const field = (k: keyof MethodView, label: string, placeholder = "", type = "text") => (
    <label className="block">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <input type={type} value={m[k]} placeholder={placeholder} onChange={(e) => setM({ ...m, [k]: e.target.value })} className={`${controlCls} mt-1.5 h-11 text-sm`} />
    </label>
  );
  async function save() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/tutor/payout-method", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(m) }).catch(() => null);
    const d = (await res?.json().catch(() => ({}))) as { method?: MethodView; error?: string };
    setBusy(false);
    if (res?.ok && d.method) onSaved(d.method);
    else setError(d.error || "We couldn't save your details.");
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Payout method">
        {(["mpesa", "bank", "paypal"] as const).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={m.method === k} onClick={() => setM({ ...m, method: k })} className={`h-11 rounded-xl text-sm font-semibold ring-1 ${m.method === k ? "bg-brand-700 text-white ring-brand-700" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"}`}>
            {k === "mpesa" ? "M-Pesa" : k === "bank" ? "Bank" : "PayPal"}
          </button>
        ))}
      </div>
      {m.method === "mpesa" && field("mpesaPhone", "M-Pesa number", "+254 712 345 678", "tel")}
      {m.method === "bank" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {field("accountName", "Account name")}
          {field("bankName", "Bank")}
          {field("accountNumber", "Account number")}
          {field("swift", "SWIFT / branch code (optional)")}
        </div>
      )}
      {m.method === "paypal" && field("paypalEmail", "PayPal email", "you@example.com", "email")}
      {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
          {busy && <Loader2 size={16} className="animate-spin" />} Save payout details
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

const summary = (m: MethodView) => (m.method === "mpesa" ? `M-Pesa · ${m.mpesaPhone}` : m.method === "paypal" ? `PayPal · ${m.paypalEmail}` : `${m.bankName} · ••••${m.accountNumber.slice(-4)}`);

export function Earnings({ data, tz }: { data: EarningsView; tz: string }) {
  const router = useRouter();
  const [method, setMethod] = useState<MethodView | null>(data.method);
  const [editing, setEditing] = useState(!data.method);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const c = data.currency;
  const t = data.totals;
  const canWithdraw = t.available > 0 && t.available >= data.minimumPayout && !!method;

  async function withdraw() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/tutor/payouts", { method: "POST", credentials: "include" }).catch(() => null);
    const d = (await res?.json().catch(() => ({}))) as { payout?: { amount: number; reference: string }; error?: string };
    setBusy(false);
    if (res?.ok && d.payout) {
      setMsg({ ok: true, t: `Payout of ${money(d.payout.amount, c)} requested (${d.payout.reference}). We'll email you when it's sent.` });
      router.refresh();
    } else setMsg({ ok: false, t: d.error || "We couldn't request the payout." });
  }

  const tiles = [
    { icon: Wallet, label: "Available", value: t.available, note: "Ready to withdraw", tone: "bg-emerald-50 text-emerald-700" },
    { icon: Hourglass, label: "Clearing", value: t.pending, note: `${data.holdDays} days after each lesson`, tone: "bg-amber-50 text-amber-700" },
    { icon: Clock, label: "Upcoming", value: t.upcoming, note: "Paid lessons ahead", tone: "bg-brand-50 text-brand-700" },
    { icon: CheckCircle2, label: "Paid out", value: t.paidOut + t.inPayout, note: t.inPayout ? `${money(t.inPayout, c)} on its way` : "All time", tone: "bg-slate-100 text-slate-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((x) => (
          <div key={x.label} className="rounded-3xl bg-white p-5 ring-1 ring-slate-200/70">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${x.tone}`}>
              <x.icon size={19} />
            </span>
            <p className="mt-3 text-sm text-slate-500">{x.label}</p>
            <p className="font-heading text-2xl font-bold text-slate-900">{money(x.value, c)}</p>
            <p className="text-xs text-slate-500">{x.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200/70">
          <h2 className="font-heading text-lg font-bold text-slate-900">Withdraw</h2>
          <p className="mt-1 text-sm text-slate-500">
            You keep {100 - data.feePercent}% of each lesson. Minimum payout {money(data.minimumPayout, c)}.
          </p>
          <p className="mt-4 font-heading text-3xl font-bold text-slate-900">{money(t.available, c)}</p>
          {msg && <p className={`mt-3 rounded-xl px-3 py-2 text-sm font-medium ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>{msg.t}</p>}
          <button type="button" onClick={withdraw} disabled={!canWithdraw || busy} className="mt-4 inline-flex h-12 items-center gap-2 rounded-xl bg-brand-700 px-5 font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowDownToLine size={18} />} Request payout
          </button>
          {!method && <p className="mt-2 text-xs text-slate-500">Add your payout details to withdraw.</p>}
        </section>
        <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200/70">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-bold text-slate-900">Payout details</h2>
            {method && !editing && (
              <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
                <Pencil size={14} /> Change
              </button>
            )}
          </div>
          <div className="mt-4">
            {editing ? (
              <MethodForm initial={method} onSaved={(m) => (setMethod(m), setEditing(false))} onCancel={method ? () => setEditing(false) : undefined} />
            ) : (
              method && (
                <p className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 font-medium text-slate-800">
                  <Banknote size={20} className="text-slate-500" /> {summary(method)}
                </p>
              )
            )}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200/70">
        <h2 className="p-5 font-heading text-lg font-bold text-slate-900 sm:px-6">Lesson earnings</h2>
        {data.rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Lesson</th>
                  <th className="px-3 py-3 font-semibold">Student</th>
                  <th className="px-3 py-3 text-right font-semibold">Paid</th>
                  <th className="px-3 py-3 text-right font-semibold">Fee</th>
                  <th className="px-3 py-3 text-right font-semibold">You earn</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.rows.map((r) => (
                  <tr key={r.bookingId}>
                    <td className="px-6 py-3">
                      <span className="block font-medium text-slate-900">{r.lesson}</span>
                      <span className="text-xs text-slate-500">{fmtDay(r.date, tz, { month: "short", day: "numeric", year: "numeric" })}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{r.student}</td>
                    <td className="px-3 py-3 text-right text-slate-700">{money(r.gross, c)}</td>
                    <td className="px-3 py-3 text-right text-slate-500">−{money(r.fee, c)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900">{money(r.net, c)}</td>
                    <td className="px-6 py-3">
                      <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STATE[r.state]!.c}`}>{STATE[r.state]!.t}</span>
                      {r.availableOn && r.state === "pending" && <span className="mt-1 block text-xs text-slate-500">from {fmtDay(r.availableOn, tz, { month: "short", day: "numeric" })}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-6 pb-6 text-sm text-slate-500">Earnings appear here once students pay for lessons with you.</p>
        )}
      </section>

      {data.payouts.length > 0 && (
        <section className="rounded-3xl bg-white p-5 ring-1 ring-slate-200/70 sm:p-6">
          <h2 className="font-heading text-lg font-bold text-slate-900">Payouts</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {data.payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span>
                  <span className="block font-medium text-slate-900">
                    {money(p.amount, p.currency)} · {p.reference}
                  </span>
                  <span className="text-xs text-slate-500">
                    {fmtDay(p.createdAt, tz, { month: "short", day: "numeric", year: "numeric" })}
                    {p.transferRef ? ` · ref ${p.transferRef}` : ""}
                    {p.notes ? ` · ${p.notes}` : ""}
                  </span>
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.status === "paid" ? "bg-emerald-50 text-emerald-800" : p.status === "failed" || p.status === "cancelled" ? "bg-rose-50 text-rose-700" : "bg-brand-50 text-brand-800"}`}>{PAYOUT[p.status] ?? p.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

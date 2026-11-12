import Link from "next/link";
import { Receipt } from "lucide-react";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { studentPayments } from "@/cms/payments/server";
import { PageHeader } from "@/components/portal/PageHeader";
import { fmtDay, safeTz } from "@/lib/time";
import { money } from "@/lib/money";

export const metadata = { title: "Payments" };
export const dynamic = "force-dynamic";

const LABEL: Record<string, { t: string; c: string }> = {
  succeeded: { t: "Paid", c: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  refunded: { t: "Refunded", c: "bg-slate-100 text-slate-700 ring-slate-200" },
  partially_refunded: { t: "Part refunded", c: "bg-amber-50 text-amber-800 ring-amber-200" },
};

export default async function PaymentsPage() {
  const user = await requireUser(["student"], "/student/payments");
  const list = await studentPayments(await getPayloadClient(), user);
  const tz = safeTz(user.timezone);
  const spent = list.reduce((n, p) => n + p.amount - p.refunded, 0);
  return (
    <div className="space-y-6">
      <PageHeader title="Payments" sub="Every payment, refund and receipt in one place." />
      {list.length ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:max-w-md">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
              <p className="text-sm text-slate-500">Total spent</p>
              <p className="font-heading text-2xl font-bold text-slate-900">{money(spent, list[0]!.currency)}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
              <p className="text-sm text-slate-500">Payments</p>
              <p className="font-heading text-2xl font-bold text-slate-900">{list.length}</p>
            </div>
          </div>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200/70">
            {list.map((p) => (
              <li key={p.id}>
                <Link href={`/student/payments/${p.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 hover:bg-slate-50 sm:px-6">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <Receipt size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-900">{p.lesson}</span>
                    <span className="block text-sm text-slate-500">
                      {fmtDay(p.paidAt, tz, { month: "short", day: "numeric", year: "numeric" })} · {p.reference}
                    </span>
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${LABEL[p.status]?.c ?? ""}`}>{LABEL[p.status]?.t ?? p.status}</span>
                  <span className="w-24 text-right font-semibold text-slate-900">{money(p.amount, p.currency)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-slate-200/70">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <Receipt size={26} />
          </span>
          <h2 className="mt-4 font-heading text-xl font-bold text-slate-900">No payments yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-slate-500">When you book a lesson, your receipts appear here.</p>
        </div>
      )}
    </div>
  );
}

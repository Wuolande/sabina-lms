import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { PrintButton } from "@/components/payments/PrintButton";
import { fmtDay, fmtRange, safeTz } from "@/lib/time";
import { money } from "@/lib/money";
import type { Booking, TutorProfile } from "@/payload-types";

export const metadata = { title: "Receipt" };
export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(["student"], `/student/payments/${id}`);
  const payload = await getPayloadClient();
  const p = await payload.findByID({ collection: "payments", id: Number(id), depth: 2, overrideAccess: true }).catch(() => null);
  if (!p || (typeof p.student === "object" ? p.student.id : p.student) !== user.id || p.status === "pending" || p.status === "failed" || p.status === "cancelled") notFound();
  const b = p.booking as Booking;
  const t = b.tutor as TutorProfile;
  const tz = safeTz(user.timezone);
  const row = (k: string, v: React.ReactNode) => (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right font-medium text-slate-900">{v}</dd>
    </div>
  );
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/student/payments" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
          <ArrowLeft size={16} /> Payments
        </Link>
        <PrintButton />
      </div>
      <article className="rounded-3xl bg-white p-6 ring-1 ring-slate-200/70 sm:p-10 print:ring-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-heading text-xl font-bold text-brand-800">Sabina</p>
            <p className="text-sm text-slate-500">Online tutoring</p>
          </div>
          <div className="text-right">
            <h1 className="font-heading text-2xl font-bold text-slate-900">Receipt</h1>
            <p className="text-sm text-slate-500">{p.reference}</p>
          </div>
        </div>
        <dl className="mt-8 divide-y divide-slate-100 text-sm">
          {row("Billed to", `${user.firstName ?? ""} ${user.lastName ?? ""} · ${user.email}`)}
          {row("Date paid", fmtDay(p.paidAt ?? p.createdAt, tz, { year: "numeric", month: "long", day: "numeric" }))}
          {row("Lesson", `${b.kind === "trial" ? "Trial lesson" : `${b.minutes}-minute lesson`} with ${t?.displayName ?? "tutor"}`)}
          {row("Lesson time", `${fmtDay(b.startsAt, tz, { month: "short", day: "numeric", year: "numeric" })}, ${fmtRange(b.startsAt, b.endsAt, tz)}`)}
          {row("Booking", b.reference)}
          {row("Paid with", `${p.provider === "paystack" ? "Paystack" : p.provider === "stripe" ? "Stripe" : "Test payment"}${p.method ? ` (${p.method.replace("_", " ")})` : ""}`)}
          {(p.refunds ?? []).map((r, i) => row(`Refund${r.at ? ` · ${fmtDay(r.at, tz, { month: "short", day: "numeric" })}` : ""}`, `−${money(r.amount ?? 0, p.currency)} (${r.reason})`))}
        </dl>
        <div className="mt-6 flex items-baseline justify-between border-t-2 border-slate-900 pt-4">
          <span className="font-semibold text-slate-900">{p.refundedAmount ? "Total after refunds" : "Total paid"}</span>
          <span className="font-heading text-2xl font-bold text-slate-900">{money(p.amount - (p.refundedAmount ?? 0), p.currency)}</span>
        </div>
      </article>
    </div>
  );
}

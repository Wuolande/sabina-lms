import Link from "next/link";
import { notFound } from "next/navigation";
import { Package } from "lucide-react";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { enabledProviders } from "@/cms/payments/providers";
import { PayStep } from "@/components/payments/PayStep";
import { money } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Buy lessons", robots: { index: false } };

/** Pay for a lesson package. */
export default async function PackagePayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(["student"], `/checkout/package/${id}`);
  const payload = await getPayloadClient();
  const k = await payload.findByID({ collection: "lesson-packages", id: Number(id), depth: 1, overrideAccess: true }).catch(() => null);
  if (!k || (typeof k.student === "object" ? k.student.id : k.student) !== user.id) notFound();
  const tutor = typeof k.tutor === "object" ? k.tutor : null;
  const full = Math.round((k.price / (1 - (k.discountPercent ?? 0) / 100)) * 100) / 100;
  return (
    <div className="bg-slate-50 px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 ring-1 ring-slate-200/70 sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
          <Package size={22} />
        </span>
        <h1 className="mt-4 font-heading text-2xl font-bold text-slate-900">
          {k.lessons} lessons with {tutor?.displayName}
        </h1>
        <p className="mt-1 text-slate-600">
          {k.lessons} × {k.minutes}-minute lessons. Book them whenever suits you; cancel in time and the lesson goes back into your package.
        </p>
        <div className="mt-5 flex items-baseline gap-3">
          <p className="font-heading text-3xl font-bold text-slate-900">{money(k.price, k.currency)}</p>
          {k.discountPercent ? <p className="text-sm text-slate-400 line-through">{money(full, k.currency)}</p> : null}
        </div>
        <p className="text-sm text-slate-500">
          {money(k.perLesson, k.currency)} a lesson{k.discountPercent ? ` · you save ${k.discountPercent}%` : ""}
        </p>
        <div className="mt-6">
          {k.status === "pending_payment" ? (
            <PayStep packageId={k.id} amount={k.price} currency={k.currency} holdUntil={null} providers={enabledProviders()} />
          ) : k.paidAt ? (
            <div className="space-y-3">
              <p className="rounded-xl bg-emerald-50 p-4 text-emerald-800">This package is paid.</p>
              <Link href="/student/packages" className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand-700 font-semibold text-white hover:bg-brand-800">
                My packages
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="rounded-xl bg-slate-50 p-4 text-slate-600">This offer has lapsed. Choose the package again to pay.</p>
              {tutor?.slug && (
                <Link href={`/tutors/${tutor.slug}/book`} className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand-700 font-semibold text-white hover:bg-brand-800">
                  See packages
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { enabledProviders } from "@/cms/payments/providers";
import { PayStep } from "@/components/payments/PayStep";
import { fmtDay, fmtRange, safeTz } from "@/lib/time";
import { money } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Complete payment", robots: { index: false } };

/** Resume paying for a held booking (from My lessons or after a failed attempt). */
export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(["student"], `/checkout/pay/${id}`);
  const payload = await getPayloadClient();
  const b = await payload.findByID({ collection: "bookings", id: Number(id), depth: 1, overrideAccess: true }).catch(() => null);
  if (!b || (typeof b.student === "object" ? b.student.id : b.student) !== user.id) notFound();
  const tz = safeTz(user.timezone);
  const tutor = typeof b.tutor === "object" ? b.tutor : null;
  const open = b.status === "pending_payment" && b.holdUntil && Date.parse(b.holdUntil) > Date.now();
  return (
    <div className="bg-slate-50 px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 ring-1 ring-slate-200/70 sm:p-8">
        <h1 className="font-heading text-2xl font-bold text-slate-900">Complete your payment</h1>
        <p className="mt-1 text-slate-600">
          {b.kind === "trial" ? "Trial lesson" : `${b.minutes}-minute lesson`} with {tutor?.displayName}
          <br />
          {fmtDay(b.startsAt, tz)}, {fmtRange(b.startsAt, b.endsAt, tz)}
        </p>
        <p className="mt-4 font-heading text-3xl font-bold text-slate-900">{money(b.price, b.currency)}</p>
        <div className="mt-6">
          {open ? (
            <PayStep bookingId={b.id} amount={b.price} currency={b.currency} holdUntil={b.holdUntil ?? null} providers={enabledProviders()} />
          ) : b.paymentStatus === "paid" ? (
            <p className="rounded-xl bg-emerald-50 p-4 text-emerald-800">This lesson is already paid.</p>
          ) : (
            <div className="space-y-4">
              <p className="rounded-xl bg-slate-50 p-4 text-slate-600">The time we held has been released. Please pick a time again.</p>
              {tutor?.slug && (
                <Link href={`/tutors/${tutor.slug}/book`} className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand-700 font-semibold text-white hover:bg-brand-800">
                  Pick a time
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

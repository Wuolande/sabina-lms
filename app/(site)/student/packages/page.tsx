import Link from "next/link";
import { CalendarPlus, Package } from "lucide-react";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { studentPackages, type PackageView } from "@/cms/packages/server";
import { PageHeader } from "@/components/portal/PageHeader";
import { fmtDay, safeTz } from "@/lib/time";
import { money } from "@/lib/money";

export const metadata = { title: "Lesson packages" };
export const dynamic = "force-dynamic";

const STATE: Record<PackageView["status"], { t: string; c: string }> = {
  active: { t: "Active", c: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  pending_payment: { t: "Not paid yet", c: "bg-amber-50 text-amber-800 ring-amber-200" },
  used_up: { t: "All lessons booked", c: "bg-slate-100 text-slate-700 ring-slate-200" },
  expired: { t: "Expired", c: "bg-slate-100 text-slate-700 ring-slate-200" },
  refunded: { t: "Refunded", c: "bg-slate-100 text-slate-700 ring-slate-200" },
  cancelled: { t: "Cancelled", c: "bg-slate-100 text-slate-700 ring-slate-200" },
};

export default async function PackagesPage() {
  const user = await requireUser(["student"], "/student/packages");
  const list = await studentPackages(await getPayloadClient(), user);
  const tz = safeTz(user.timezone);
  return (
    <div className="space-y-6">
      <PageHeader title="Lesson packages" sub="Prepaid lessons you can book whenever suits you." />
      {list.length ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((k) => {
            const pct = k.lessons ? Math.round((k.used / k.lessons) * 100) : 0;
            const st = STATE[k.status];
            return (
              <li key={k.id} className="flex flex-col rounded-3xl bg-white p-5 ring-1 ring-slate-200/70 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-heading text-lg font-bold text-slate-900">
                      {k.lessons} × {k.minutes}-minute lessons
                    </p>
                    <p className="text-sm text-slate-500">
                      with {k.tutorSlug ? <Link href={`/tutors/${k.tutorSlug}`} className="font-medium text-slate-700 hover:text-brand-700">{k.tutorName}</Link> : k.tutorName} · {money(k.price, k.currency)}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${st.c}`}>{st.t}</span>
                </div>
                {k.paidAt && (
                  <div className="mt-5">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-semibold text-slate-900">
                        {k.status === "refunded"
                          ? `${k.lessons - k.used} unused ${k.lessons - k.used === 1 ? "lesson" : "lessons"} refunded`
                          : k.status === "expired"
                            ? `Expired with ${k.lessons - k.used} unused`
                            : `${k.left} ${k.left === 1 ? "lesson" : "lessons"} left`}
                      </span>
                      <span className="text-slate-500">
                        {k.used} of {k.lessons} booked
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={k.used} aria-valuemin={0} aria-valuemax={k.lessons} aria-label="Lessons booked">
                      <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
                    </div>
                    {k.expiresAt && k.status === "active" && <p className="mt-2 text-xs text-slate-500">Book by {fmtDay(k.expiresAt, tz, { month: "long", day: "numeric", year: "numeric" })}</p>}
                  </div>
                )}
                <div className="mt-5 flex flex-wrap gap-2">
                  {k.status === "active" && k.left > 0 && k.tutorSlug && (
                    <Link href={`/tutors/${k.tutorSlug}/book`} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800">
                      <CalendarPlus size={16} /> Book a lesson
                    </Link>
                  )}
                  {k.status === "pending_payment" && (
                    <Link href={`/checkout/package/${k.id}`} className="inline-flex h-10 items-center rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800">
                      Pay {money(k.price, k.currency)}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-slate-200/70">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700">
            <Package size={26} />
          </span>
          <h2 className="mt-4 font-heading text-xl font-bold text-slate-900">No packages yet</h2>
          <p className="mx-auto mt-1 max-w-md text-slate-600">Many tutors sell 5 or 10 lessons at a discount. You&apos;ll find their packages on the booking page.</p>
          <Link href="/find-tutors" className="mt-5 inline-flex h-11 items-center rounded-xl bg-brand-700 px-5 font-semibold text-white hover:bg-brand-800">
            Find a tutor
          </Link>
        </div>
      )}
    </div>
  );
}

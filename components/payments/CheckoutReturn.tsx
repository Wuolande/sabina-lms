"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarCheck, CheckCircle2, Hourglass, Loader2, Package, RotateCcw, XCircle } from "lucide-react";
import { fmtDay, fmtRange } from "@/lib/time";
import { money } from "@/lib/money";

type Status = {
  payment: { id: number; reference: string; status: string; amount: number; currency: string; refunded: number };
  booking?: { id: number; reference: string; status: string; paymentStatus: string; startsAt: string; endsAt: string; holdUntil: string | null; tutor: string | null; tutorSlug: string | null };
  package?: { id: number; reference: string; status: string; lessons: number; minutes: number; expiresAt: string | null; tutor: string | null; tutorSlug: string | null };
};

/** After the provider sends the student back: wait for the payment to settle, then show the result. */
export function CheckoutReturn({ reference, cancelled, tz }: { reference: string; cancelled: boolean; tz: string }) {
  const [s, setS] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    let stop = false;
    async function poll(n: number) {
      const res = await fetch(`/api/payments/status/${encodeURIComponent(reference)}`, { credentials: "include", cache: "no-store" }).catch(() => null);
      const d = (await res?.json().catch(() => null)) as (Status & { error?: string }) | null;
      if (stop) return;
      if (!res?.ok || !d?.payment) return setError(d?.error || "We couldn't find this payment.");
      setS(d);
      setTries(n);
      if (d.payment.status === "pending" && !cancelled && n < 40) setTimeout(() => poll(n + 1), n < 10 ? 1500 : 4000);
    }
    void poll(0);
    return () => {
      stop = true;
    };
  }, [reference, cancelled]);

  const box = (icon: React.ReactNode, tone: string, title: string, body: React.ReactNode, actions: React.ReactNode) => (
    <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center ring-1 ring-slate-200/70">
      <span className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${tone}`}>{icon}</span>
      <h1 className="mt-5 font-heading text-2xl font-bold text-slate-900">{title}</h1>
      <div className="mt-2 text-slate-600">{body}</div>
      <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">{actions}</div>
    </div>
  );
  const primary = "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 font-semibold text-white hover:bg-brand-800";
  const ghost = "inline-flex h-12 items-center justify-center rounded-xl px-5 font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50";

  if (error) return box(<XCircle size={30} />, "bg-rose-50 text-rose-600", "Something went wrong", error, <Link href="/student/lessons" className={primary}>My lessons</Link>);
  if (!s) return box(<Loader2 size={30} className="animate-spin" />, "bg-brand-50 text-brand-600", "Checking your payment…", "This only takes a moment.", null);

  const { payment: p } = s;
  if (s.package) {
    const k = s.package;
    if (p.status === "succeeded" && k.status !== "pending_payment")
      return box(
        <Package size={30} />,
        "bg-emerald-50 text-emerald-600",
        "Your lessons are ready to book",
        <>
          <p className="font-medium text-slate-800">
            {k.lessons} × {k.minutes}-minute lessons with {k.tutor}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Book them whenever suits you{k.expiresAt ? `, up to ${fmtDay(k.expiresAt, tz, { month: "long", day: "numeric", year: "numeric" })}` : ""}. We&apos;ve emailed your receipt ({money(p.amount, p.currency)}, {p.reference}).
          </p>
        </>,
        <>
          {k.tutorSlug && (
            <Link href={`/tutors/${k.tutorSlug}/book`} className={primary}>
              <CalendarCheck size={18} /> Book your first lesson
            </Link>
          )}
          <Link href={`/student/payments/${p.id}`} className={ghost}>
            View receipt
          </Link>
        </>,
      );
    if (p.status === "pending" && !cancelled)
      return box(<Loader2 size={30} className="animate-spin" />, "bg-brand-50 text-brand-600", "Waiting for confirmation…", <>{tries > 20 ? "This is taking longer than usual. If you approved the payment, we'll email you as soon as it's confirmed." : "If you're paying by M-Pesa, approve the prompt on your phone."}</>, <Link href="/student/packages" className={ghost}>My packages</Link>);
    return box(
      <XCircle size={30} />,
      "bg-rose-50 text-rose-600",
      cancelled ? "Payment cancelled" : "Payment didn't go through",
      "No money was taken. You can try again whenever you're ready.",
      k.status === "pending_payment" ? (
        <Link href={`/checkout/package/${k.id}`} className={primary}>
          Try again
        </Link>
      ) : (
        <Link href={k.tutorSlug ? `/tutors/${k.tutorSlug}/book` : "/find-tutors"} className={primary}>
          Choose again
        </Link>
      ),
    );
  }
  const b = s.booking!;
  const when = (
    <p className="font-medium text-slate-800">
      {fmtDay(b.startsAt, tz)}, {fmtRange(b.startsAt, b.endsAt, tz)}
    </p>
  );
  if (p.status === "succeeded" && (b.status === "confirmed" || b.status === "requested")) {
    const confirmed = b.status === "confirmed";
    return box(
      confirmed ? <CheckCircle2 size={32} /> : <Hourglass size={30} />,
      confirmed ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600",
      confirmed ? "You're booked!" : "Paid. Request sent",
      <>
        {when}
        <p className="mt-2 text-sm text-slate-500">
          {confirmed ? `Your lesson with ${b.tutor} is confirmed.` : `${b.tutor} will accept or decline soon. If they decline, you get a full refund.`} We&apos;ve emailed your receipt ({money(p.amount, p.currency)}, {p.reference}).
        </p>
      </>,
      <>
        <Link href="/student/lessons" className={primary}>
          <CalendarCheck size={18} /> My lessons
        </Link>
        <Link href={`/student/payments/${p.id}`} className={ghost}>
          View receipt
        </Link>
      </>,
    );
  }
  if (p.status === "succeeded" || p.status === "refunded" || p.status === "partially_refunded")
    return box(<RotateCcw size={28} />, "bg-amber-50 text-amber-600", "That time was taken", <>Your payment arrived after the time was released and someone else booked it, so we&apos;ve refunded you in full. Please pick another time.</>, <Link href={b.tutorSlug ? `/tutors/${b.tutorSlug}/book` : "/find-tutors"} className={primary}>Pick another time</Link>);
  if (p.status === "pending" && !cancelled)
    return box(<Loader2 size={30} className="animate-spin" />, "bg-brand-50 text-brand-600", "Waiting for confirmation…", <>{tries > 20 ? "This is taking longer than usual. If you approved the payment, we'll email you as soon as it's confirmed." : "If you're paying by M-Pesa, approve the prompt on your phone."}</>, <Link href="/student/lessons" className={ghost}>Go to my lessons</Link>);
  const canRetry = b.status === "pending_payment" && b.holdUntil && Date.parse(b.holdUntil) > Date.now();
  return box(
    <XCircle size={30} />,
    "bg-rose-50 text-rose-600",
    cancelled ? "Payment cancelled" : "Payment didn't go through",
    <>{canRetry ? "No money was taken. Your time is still held for a few more minutes." : "No money was taken. The time we held has been released."}</>,
    canRetry ? (
      <Link href={`/checkout/pay/${b.id}`} className={primary}>
        Try again
      </Link>
    ) : (
      <Link href={b.tutorSlug ? `/tutors/${b.tutorSlug}/book` : "/find-tutors"} className={primary}>
        Pick a time again
      </Link>
    ),
  );
}

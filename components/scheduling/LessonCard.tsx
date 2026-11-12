"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, Check, Clock, Loader2, Star, Video, X } from "lucide-react";
import type { LessonView } from "@/cms/scheduling/server";
import { fmtDay, fmtRange } from "@/lib/time";
import { money } from "@/lib/money";

const initials = (n: string) =>
  n
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 2);

export function PersonAvatar({ name, src, size = 48 }: { name: string; src: string | null; size?: number }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={size} height={size} className="shrink-0 rounded-2xl object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 font-heading font-bold text-white" style={{ width: size, height: size, fontSize: size * 0.34 }} aria-hidden>
      {initials(name)}
    </span>
  );
}

const STATUS: Record<string, { label: string; cls: string }> = {
  pending_payment: { label: "Awaiting payment", cls: "bg-violet-50 text-violet-800 ring-violet-200" },
  requested: { label: "Awaiting tutor", cls: "bg-amber-50 text-amber-800 ring-amber-200" },
  confirmed: { label: "Confirmed", cls: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  completed: { label: "Completed", cls: "bg-slate-100 text-slate-700 ring-slate-200" },
  declined: { label: "Declined", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  cancelled: { label: "Cancelled", cls: "bg-slate-100 text-slate-600 ring-slate-200" },
  expired: { label: "Expired", cls: "bg-slate-100 text-slate-600 ring-slate-200" },
  no_show: { label: "No-show", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
};

export function StatusPill({ lesson, role }: { lesson: LessonView; role: "student" | "tutor" }) {
  let s = STATUS[lesson.status] ?? STATUS.cancelled!;
  if (lesson.status === "requested" && role === "tutor") s = { label: "Needs your reply", cls: "bg-amber-50 text-amber-800 ring-amber-200" };
  if (lesson.status === "confirmed" && lesson.phase === "finished") s = { label: "Finished", cls: "bg-slate-100 text-slate-700 ring-slate-200" };
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${s.cls}`}>{s.label}</span>;
}

async function act(id: number, action: string, reason?: string) {
  const res = await fetch(`/api/bookings/${id}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, reason }) }).catch(() => null);
  const data = (await res?.json().catch(() => ({}))) as { error?: string };
  if (!res?.ok) throw new Error(data.error || "Something went wrong. Please try again.");
}

/** One lesson with the actions the viewer may take (accept / decline / cancel). */
export function LessonCard({ lesson: l, role, tz, cancellationHours }: { lesson: LessonView; role: "student" | "tutor"; tz: string; cancellationHours: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<null | "cancel" | "decline">(null);
  const [reason, setReason] = useState("");

  async function run(action: string, why?: string) {
    setBusy(action);
    setError(null);
    try {
      await act(l.id, action, why);
      setDialog(null);
      setReason("");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const needsReason = dialog === "cancel" && role === "tutor" && l.status === "confirmed";
  // Decided after mount so server and browser render the same thing.
  const [canJoin, setCanJoin] = useState(false);
  useEffect(() => {
    const check = () => setCanJoin(l.status === "confirmed" && Date.now() >= Date.parse(l.joinOpensAt) && Date.now() <= Date.parse(l.joinClosesAt));
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, [l.status, l.joinOpensAt, l.joinClosesAt]);
  const detail = `/${role}/lessons/${l.id}`;
  const name = l.other.href ? (
    <Link href={l.other.href} className="hover:text-brand-700 hover:underline">
      {l.other.name}
    </Link>
  ) : (
    l.other.name
  );

  return (
    <article data-lesson={l.reference} className="rounded-3xl bg-white p-4 ring-1 ring-slate-200/70 sm:p-5">
      <div className="flex gap-4">
        <PersonAvatar name={l.other.name} src={l.other.avatar} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
            <div className="min-w-0">
              <h3 className="font-heading text-base font-bold text-slate-900 sm:text-lg">
                <Link href={detail} className="hover:text-brand-700">{l.kind === "trial" ? "Trial lesson" : `${l.subject ?? "Lesson"}`}</Link> <span className="font-normal text-slate-500">with</span> {name}
              </h3>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock size={15} className="text-slate-400" />
                  {fmtDay(l.startsAt, tz, { weekday: "short", month: "short", day: "numeric" })}, {fmtRange(l.startsAt, l.endsAt, tz)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={15} className="text-slate-400" /> {l.minutes} min{l.kind === "trial" && l.subject ? ` · ${l.subject}` : ""}
                </span>
              </p>
            </div>
            <StatusPill lesson={l} role={role} />
          </div>

          {l.note && role === "tutor" && <p className="mt-3 rounded-2xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">&ldquo;{l.note}&rdquo;</p>}
          {l.cancelReason && (l.status === "cancelled" || l.status === "declined") && (
            <p className="mt-3 text-sm text-slate-500">
              {l.cancelledBy === role ? "Your reason" : "Reason"}: &ldquo;{l.cancelReason}&rdquo;
            </p>
          )}
          {l.status === "cancelled" && l.lateCancellation && <p className="mt-1 text-xs font-medium text-amber-700">Cancelled inside the free-cancellation window.</p>}
          {l.refundedAmount > 0 && role === "student" && <p className="mt-1 text-xs font-medium text-emerald-700">Refunded {money(l.refundedAmount, l.currency)}</p>}
          {l.phase === "payment" && <p className="mt-2 text-sm text-violet-800">Pay to {role === "student" ? "secure this time" : "confirm"}. We hold it for you for a few minutes.</p>}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-900">{money(l.price, l.currency)}</span> · Ref {l.reference}
            </p>
            {!dialog && (
              <div className="flex flex-wrap gap-2">
                {role === "student" && l.status === "completed" && !l.reviewed && (
                  <Link href={detail} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-amber-50 px-4 text-sm font-semibold text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100">
                    <Star size={16} /> Write a review
                  </Link>
                )}
                {(l.phase === "finished" || l.phase === "cancelled") && (
                  <Link href={detail} className="inline-flex h-10 items-center rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                    Details
                  </Link>
                )}
                {l.canRespond && (
                  <>
                    <button type="button" onClick={() => run("accept")} disabled={!!busy} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                      {busy === "accept" ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Accept
                    </button>
                    <button type="button" onClick={() => setDialog("decline")} disabled={!!busy} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
                      <X size={16} /> Decline
                    </button>
                  </>
                )}
                {canJoin && (
                  <Link href={`/lessons/${l.id}`} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700">
                    <Video size={16} /> Join lesson
                  </Link>
                )}
                {l.phase === "payment" && role === "student" && (
                  <Link href={`/checkout/pay/${l.id}`} className="inline-flex h-10 items-center rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800">
                    Pay now
                  </Link>
                )}
                {l.canCancel && !l.canRespond && (
                  <button type="button" onClick={() => setDialog("cancel")} className="inline-flex h-10 items-center rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
                    {l.phase === "payment" ? "Cancel" : l.status === "requested" && role === "student" ? "Withdraw request" : "Cancel lesson"}
                  </button>
                )}
              </div>
            )}
          </div>

          {dialog && (
            <div role="dialog" aria-label={dialog === "decline" ? "Decline request" : "Cancel lesson"} className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              {dialog === "cancel" && role === "student" && l.lateIfCancelledNow && (
                <p className="mb-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" /> This lesson starts in less than {cancellationHours} hours, so cancelling now counts as a late cancellation.
                </p>
              )}
              <label className="block text-sm font-semibold text-slate-800" htmlFor={`reason-${l.id}`}>
                {dialog === "decline" ? "Message to the student (optional)" : needsReason ? "Tell the student why you're cancelling" : "Reason (optional)"}
              </label>
              <textarea id={`reason-${l.id}`} value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={500} className="mt-1.5 w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500" />
              {error && <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>}
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => (setDialog(null), setError(null))} className="h-10 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                  Keep it
                </button>
                <button
                  type="button"
                  onClick={() => run(dialog, reason)}
                  disabled={!!busy || (needsReason && !reason.trim())}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {busy && <Loader2 size={16} className="animate-spin" />} {dialog === "decline" ? "Decline request" : l.status === "requested" && role === "student" ? "Withdraw request" : "Cancel lesson"}
                </button>
              </div>
            </div>
          )}
          {error && !dialog && <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>}
        </div>
      </div>
    </article>
  );
}

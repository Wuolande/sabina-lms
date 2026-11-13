"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarClock, ChevronRight, Flag, Loader2, MessageSquare, NotebookPen, Receipt, Star, Video } from "lucide-react";
import type { LessonDetailView } from "@/cms/lessons/server";
import { PersonAvatar, StatusPill } from "@/components/scheduling/LessonCard";
import { fmtDay, fmtRange, fmtTime } from "@/lib/time";
import { money } from "@/lib/money";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { RichText } from "@/components/content/RichText";
import type { Lexical } from "@/cms/content/rich";

async function post(id: number, body: object) {
  const res = await fetch(`/api/lessons/${id}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  const d = (await res?.json().catch(() => ({}))) as { error?: string };
  if (!res?.ok) throw new Error(d.error || "Something went wrong. Please try again.");
}

/** Grouped section, iOS-settings style: a small caption over a rounded card. */
function Group({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section>
      {title && <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-slate-500">{title}</h2>}
      <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200/70">{children}</div>
    </section>
  );
}

export function Stars({ value, onChange, size = 28 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <div className="flex gap-1" role={onChange ? "radiogroup" : undefined} aria-label={onChange ? "Rating" : `${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => onChange(n)} className="rounded-md p-0.5 transition active:scale-90">
            <Star size={size} className={n <= value ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
          </button>
        ) : (
          <Star key={n} size={size} className={n <= value ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
        ),
      )}
    </div>
  );
}

const PROMPT = ["", "What went wrong?", "What could have been better?", "What was OK, and what wasn't?", "What did you like?", "What made it great?"];

function ReviewForm({ id, tutor }: { id: number; tutor: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="p-5 sm:p-6">
      <p className="font-semibold text-slate-900">How was your lesson with {tutor}?</p>
      <p className="mt-0.5 text-sm text-slate-500">Your review helps other students choose. It shows your first name only.</p>
      <div className="mt-4">
        <Stars value={rating} onChange={setRating} size={32} />
      </div>
      {rating > 0 && (
        <>
          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-700">{PROMPT[rating]} (optional)</span>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={1500} className="mt-1.5 w-full rounded-2xl border-0 bg-slate-50 px-4 py-3 text-[15px] ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500" />
          </label>
          {error && <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>}
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await post(id, { action: "review", rating, comment });
                router.refresh();
              } catch (e) {
                setError((e as Error).message);
                setBusy(false);
              }
            }}
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-brand-700 px-6 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {busy && <Loader2 size={16} className="animate-spin" />} Post review
          </button>
        </>
      )}
    </div>
  );
}

function NotesEditor({ id, initial, done }: { id: number; initial: Lexical | null; done: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center justify-between gap-3 p-5 text-left hover:bg-slate-50 sm:px-6">
        <span>
          <span className="block font-semibold text-slate-900">{initial ? "Edit lesson notes" : done ? "Add lesson notes" : "Finish lesson and add notes"}</span>
          <span className="text-sm text-slate-500">{initial || done ? "Your student sees these on their lesson page." : "Mark the lesson as done. Notes are optional."}</span>
        </span>
        <ChevronRight size={18} className="text-slate-400" />
      </button>
    );
  return (
    <div className="p-5 sm:p-6">
      <div className="block">
        <label htmlFor={`notes-${id}`} className="text-sm font-semibold text-slate-800">Notes for your student</label>
        <div className="mt-1.5">
          <RichTextEditor id={`notes-${id}`} aria-label="Notes for your student" value={notes} onChange={setNotes} placeholder="What you covered, and what to practise before next time" minHeight={130} />
        </div>
      </div>
      {error && <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await post(id, { action: "finish", notes });
              setOpen(false);
              router.refresh();
            } catch (e) {
              setError((e as Error).message);
            }
            setBusy(false);
          }}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-700 px-6 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {busy && <Loader2 size={16} className="animate-spin" />} {initial || done ? "Save notes" : "Finish lesson"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-full px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </div>
  );
}

function ReportProblem({ id }: { id: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-3 p-5 text-left text-rose-600 hover:bg-rose-50/50 sm:px-6">
        <Flag size={18} /> <span className="font-semibold">Report a problem</span>
      </button>
    );
  return (
    <div className="p-5 sm:p-6">
      <label className="block">
        <span className="text-sm font-semibold text-slate-800">What went wrong?</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={2000} placeholder="For example: the tutor didn't turn up, or we lost connection after 10 minutes" className="mt-1.5 w-full rounded-2xl border-0 bg-slate-50 px-4 py-3 text-[15px] ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500" />
      </label>
      <p className="mt-1 text-xs text-slate-500">Our support team reads every report and replies by email within a day.</p>
      {error && <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy || text.trim().length < 10}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await post(id, { action: "report", text });
              router.refresh();
            } catch (e) {
              setError((e as Error).message);
              setBusy(false);
            }
          }}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-rose-600 px-6 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {busy && <Loader2 size={16} className="animate-spin" />} Send report
        </button>
        <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-full px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </div>
  );
}

export function LessonDetail({ l, tz }: { l: LessonDetailView; tz: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const open = now != null && now >= Date.parse(l.joinOpensAt) && now <= Date.parse(l.joinClosesAt);
  const list = l.role === "tutor" ? "/tutor/lessons" : "/student/lessons";
  const first = l.other.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href={list} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
        <ArrowLeft size={16} /> Lessons
      </Link>

      <header className="flex items-start gap-4">
        <PersonAvatar name={l.other.name} src={l.other.avatar} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{l.title}</h1>
          </div>
          <p className="mt-1 text-slate-600">
            with{" "}
            {l.other.href ? (
              <Link href={l.other.href} className="font-semibold text-slate-900 hover:text-brand-700">
                {l.other.name}
              </Link>
            ) : (
              <span className="font-semibold text-slate-900">{l.other.name}</span>
            )}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Link href={l.messageHref} className="inline-flex h-7 items-center gap-1.5 rounded-full bg-brand-50 px-3 text-[13px] font-semibold text-brand-700 hover:bg-brand-100">
              <MessageSquare size={14} /> Message {first}
            </Link>
            <StatusPill lesson={{ status: l.status, phase: l.status === "confirmed" && Date.parse(l.endsAt) < (now ?? 0) ? "finished" : "upcoming" } as never} role={l.role} />
          </div>
        </div>
      </header>

      <Group>
        <div className="flex items-center gap-3 p-5 sm:px-6">
          <CalendarClock size={20} className="shrink-0 text-slate-400" />
          <div>
            <p className="font-semibold text-slate-900">{fmtDay(l.startsAt, tz)}</p>
            <p className="text-sm text-slate-500">
              {fmtRange(l.startsAt, l.endsAt, tz)} · {l.minutes} min · Ref {l.reference}
            </p>
          </div>
        </div>
        {l.classroom && (
          <div className="border-t border-slate-100 p-5 sm:px-6">
            {open ? (
              <Link href={`/lessons/${l.id}`} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-700 font-semibold text-white hover:bg-brand-800">
                <Video size={18} /> Join lesson
              </Link>
            ) : (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Video size={17} /> The classroom opens at {fmtTime(l.joinOpensAt, tz)} on {fmtDay(l.joinOpensAt, tz, { weekday: "long" })}.
              </p>
            )}
          </div>
        )}
      </Group>

      {l.note && (
        <Group title={l.role === "tutor" ? "Note from your student" : "Your note to the tutor"}>
          <p className="whitespace-pre-wrap p-5 text-[15px] text-slate-700 sm:px-6">{l.note}</p>
        </Group>
      )}

      {l.status === "no_show" && (
        <Group>
          <p className="p-5 text-[15px] text-slate-700 sm:px-6">
            {l.noShowBy === "tutor" ? (l.role === "student" ? `${first} didn't join this lesson, so we've refunded you in full.` : "You didn't join this lesson, so the student was refunded.") : "Marked as missed."}
          </p>
        </Group>
      )}

      {(l.tutorNotes || l.canFinish) && (
        <Group title="Lesson notes">
          {l.tutorNotes && (
            <div className="flex gap-3 p-5 sm:px-6">
              <NotebookPen size={20} className="mt-0.5 shrink-0 text-slate-400" />
              <RichText data={l.tutorNotes} className="min-w-0 text-[15px] text-slate-700" />
            </div>
          )}
          {l.canFinish && (
            <div className={l.tutorNotes ? "border-t border-slate-100" : ""}>
              <NotesEditor id={l.id} initial={l.tutorNotes ?? null} done={l.status === "completed"} />
            </div>
          )}
        </Group>
      )}

      {(l.canReview || l.review) && (
        <Group title="Review">
          {l.review ? (
            <div className="p-5 sm:px-6">
              <Stars value={l.review.rating} size={20} />
              {l.review.comment && <p className="mt-2 text-[15px] text-slate-700">&ldquo;{l.review.comment}&rdquo;</p>}
              {l.review.reply && (
                <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">{l.role === "student" ? first : "Your reply"}:</span> {l.review.reply}
                </p>
              )}
            </div>
          ) : (
            <ReviewForm id={l.id} tutor={first!} />
          )}
        </Group>
      )}

      {l.role === "student" && (
        <Group title="Payment">
          <div className="flex items-center justify-between gap-3 p-5 sm:px-6">
            <span className="text-slate-600">{l.refunded ? `Paid ${money(l.price, l.currency)}, refunded ${money(l.refunded, l.currency)}` : `Paid ${money(l.price, l.currency)}`}</span>
            {l.paymentId && (
              <Link href={`/student/payments/${l.paymentId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
                <Receipt size={15} /> Receipt
              </Link>
            )}
          </div>
        </Group>
      )}

      {(l.canReport || l.reported) && (
        <Group>
          {l.reported ? <p className="p-5 text-sm text-slate-600 sm:px-6">Thanks for telling us. Our support team is looking into it and will email you.</p> : <ReportProblem id={l.id} />}
        </Group>
      )}
    </div>
  );
}

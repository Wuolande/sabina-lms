import Link from "next/link";
import { ArrowLeft, CheckCircle2, ClipboardList, ListChecks, MessageSquareQuote, Paperclip, XCircle } from "lucide-react";
import type { AssignmentView } from "@/cms/progress/server";
import { RichText } from "@/components/content/RichText";
import { fmtDay } from "@/lib/time";
import { GiveFeedback, HandIn, RemoveHomework, TakeQuiz } from "./HomeworkActions";
import { statusOf } from "./HomeworkList";

const card = "rounded-3xl bg-white p-5 ring-1 ring-slate-200/70 sm:p-6";

/** One piece of homework or a quiz, for the student doing it or the tutor who set it. */
export function HomeworkPage({ a, viewer, tz }: { a: AssignmentView; viewer: "student" | "tutor"; tz: string }) {
  const st = statusOf(a, viewer);
  const Icon = a.kind === "quiz" ? ListChecks : ClipboardList;
  const back = viewer === "tutor" ? `/tutor/students/${a.student.id}` : "/student/homework";
  const finished = a.status !== "assigned";
  const other = viewer === "tutor" ? a.student.name : a.tutor.name;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={back} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
        <ArrowLeft size={16} /> {viewer === "tutor" ? a.student.name : "Homework"}
      </Link>
      <header className={card}>
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
            <Icon size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-2xl font-bold text-slate-900">{a.title}</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {a.kind === "quiz" ? "Quiz" : "Homework"} {viewer === "tutor" ? "for" : "from"} {other}
              {a.subject ? ` · ${a.subject}` : ""} · set {fmtDay(a.createdAt, tz, { month: "short", day: "numeric" })}
              {a.dueAt ? ` · due ${fmtDay(a.dueAt, tz, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}` : ""}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${st.c}`}>{st.t}</span>
        </div>
        {a.instructions && <RichText data={a.instructions} className="mt-5 text-[15px]" />}
        {viewer === "tutor" && !finished && (
          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Waiting for {a.student.name.split(" ")[0]} to {a.kind === "quiz" ? "take the quiz" : "hand it in"}.
            <RemoveHomework id={a.id} back={back} />
          </div>
        )}
      </header>

      {/* Doing it */}
      {viewer === "student" && !finished && (
        <section className={card}>
          <h2 className="mb-4 font-heading text-lg font-bold text-slate-900">{a.kind === "quiz" ? `${a.questions.length} ${a.questions.length === 1 ? "question" : "questions"}` : "Hand it in"}</h2>
          {a.kind === "quiz" ? <TakeQuiz id={a.id} questions={a.questions.map((q) => ({ prompt: q.prompt, type: q.type, options: q.options }))} /> : <HandIn id={a.id} />}
        </section>
      )}

      {/* Quiz answers (after finishing, or the tutor's answer key) */}
      {a.kind === "quiz" && (finished || viewer === "tutor") && (
        <section className={card}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-heading text-lg font-bold text-slate-900">{finished ? "Answers" : "Answer key"}</h2>
            {finished && (
              <p className="font-heading text-2xl font-bold text-slate-900">
                {a.score}
                <span className="text-base font-medium text-slate-400">/{a.outOf}</span>
              </p>
            )}
          </div>
          <ol className="mt-4 space-y-4">
            {a.questions.map((q, i) => {
              const given = q.type === "choice" ? (q.response != null ? q.options[Number(q.response)] : null) : (q.response as string | null);
              const right = q.type === "choice" ? (q.correct != null ? q.options[q.correct] : null) : q.accepted.join(" or ");
              return (
                <li key={i} className={`rounded-2xl p-4 ring-1 ${!finished ? "ring-slate-200" : q.right ? "bg-emerald-50/50 ring-emerald-200" : "bg-rose-50/50 ring-rose-200"}`}>
                  <p className="flex items-start gap-2 font-semibold text-slate-900">
                    {finished && (q.right ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" aria-label="Right" /> : <XCircle size={18} className="mt-0.5 shrink-0 text-rose-600" aria-label="Wrong" />)}
                    <span className="whitespace-pre-wrap">
                      {i + 1}. {q.prompt}
                    </span>
                  </p>
                  <dl className="mt-2 space-y-1 text-sm">
                    {finished && (
                      <div className="flex gap-2">
                        <dt className="text-slate-500">{viewer === "tutor" ? "Their answer:" : "Your answer:"}</dt>
                        <dd className="font-medium text-slate-800">{given || <span className="text-slate-400">No answer</span>}</dd>
                      </div>
                    )}
                    {(!q.right || !finished) && right && (
                      <div className="flex gap-2">
                        <dt className="text-slate-500">Right answer:</dt>
                        <dd className="font-medium text-emerald-800">{right}</dd>
                      </div>
                    )}
                    {q.explanation && <p className="pt-1 text-slate-600">{q.explanation}</p>}
                  </dl>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* Handed-in homework */}
      {a.kind === "homework" && finished && (
        <section className={card}>
          <h2 className="font-heading text-lg font-bold text-slate-900">{viewer === "tutor" ? `${a.student.name.split(" ")[0]}'s work` : "What you handed in"}</h2>
          {a.submittedAt && <p className="text-sm text-slate-500">Handed in {fmtDay(a.submittedAt, tz, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>}
          {a.answer && <RichText data={a.answer} className="mt-4 text-[15px]" />}
          {a.files.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {a.files.map((f) => (
                <li key={f.id}>
                  <a href={f.url ?? "#"} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-50 px-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100">
                    <Paperclip size={15} /> {f.name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Feedback */}
      {finished && (a.feedback || viewer === "tutor") && (
        <section className={card}>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-900">
            <MessageSquareQuote size={19} className="text-brand-600" /> {viewer === "tutor" ? "Your feedback" : `Feedback from ${a.tutor.name}`}
          </h2>
          {a.feedback && <RichText data={a.feedback} className="mt-3 text-[15px]" />}
          {viewer === "tutor" && (
            <div className="mt-4">
              <GiveFeedback id={a.id} hasFeedback={Boolean(a.feedback)} />
            </div>
          )}
        </section>
      )}
      {viewer === "student" && a.kind === "homework" && a.status === "submitted" && <p className="text-center text-sm text-slate-500">{a.tutor.name} will leave feedback soon. We&apos;ll email you.</p>}
    </div>
  );
}

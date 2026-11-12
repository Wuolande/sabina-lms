"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Award, Check, ChevronRight, CircleHelp, Loader2, X } from "lucide-react";

type Lesson = { id: string; title: string; minutes: number; video: string | null; done: boolean };
type Course = {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  lessons: Lesson[];
  quiz: { passMark: number; questions: { question: string; options: string[] }[] };
  best: number | null;
  attempts: number;
  passed: boolean;
  certificate: string | null;
};
type Result = { score: number; passMark: number; passed: boolean; results: { correct: boolean; answer: number; explain: string }[]; certificate: string | null };

/** Cloudflare Stream id, YouTube or Vimeo link → embeddable URL. */
function embedUrl(v: string) {
  const yt = v.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = v.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  if (/^[a-f0-9]{32}$/i.test(v.trim())) return `https://iframe.videodelivery.net/${v.trim()}`;
  return null;
}

async function post<T>(slug: string, body: object): Promise<T> {
  const res = await fetch(`/api/academy/${slug}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Something went wrong. Please try again.");
  return data as T;
}

export function CoursePlayer({ course, bodies }: { course: Course; bodies: ReactNode[] }) {
  const router = useRouter();
  const hasQuiz = course.quiz.questions.length > 0;
  const firstOpen = course.lessons.findIndex((l) => !l.done);
  const [step, setStep] = useState(firstOpen === -1 ? (hasQuiz ? course.lessons.length : 0) : firstOpen);
  const [doneIds, setDoneIds] = useState(new Set(course.lessons.filter((l) => l.done).map((l) => l.id)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const allDone = course.lessons.every((l) => doneIds.has(l.id));
  const onQuiz = hasQuiz && step === course.lessons.length;
  const lesson = course.lessons[step];

  const finishLesson = async () => {
    if (!lesson) return;
    setBusy(true);
    setError(null);
    try {
      if (!doneIds.has(lesson.id)) {
        await post(course.slug, { action: "complete", lesson: lesson.id });
        setDoneIds((s) => new Set(s).add(lesson.id));
      }
      setStep((i) => Math.min(i + 1, hasQuiz ? course.lessons.length : course.lessons.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const steps = [...course.lessons.map((l) => ({ key: l.id, title: l.title, meta: `${l.minutes} min`, done: doneIds.has(l.id) })), ...(hasQuiz ? [{ key: "quiz", title: "Quiz", meta: `${course.quiz.questions.length} questions`, done: course.passed }] : [])];

  return (
    <div className="space-y-6">
      <Link href="/tutor/training" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
        <ArrowLeft size={16} /> Academy
      </Link>
      <div>
        <h1 className="font-heading text-[28px] font-bold tracking-tight text-slate-900">{course.title}</h1>
        <p className="mt-1 text-[15px] text-slate-500">{course.summary}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr] lg:items-start">
        <nav aria-label="Course steps" className="lg:sticky lg:top-24">
          <ol className="divide-y divide-slate-100 overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200/70">
            {steps.map((s, i) => {
              const locked = s.key === "quiz" && !allDone;
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => setStep(i)}
                    aria-current={step === i ? "step" : undefined}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${step === i ? "bg-brand-50" : "hover:bg-slate-50"}`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${s.done ? "bg-emerald-500 text-white" : step === i ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"}`}
                      aria-hidden="true"
                    >
                      {s.done ? <Check size={15} strokeWidth={3} /> : s.key === "quiz" ? <CircleHelp size={15} /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[15px] ${step === i ? "font-semibold text-brand-800" : "font-medium text-slate-800"}`}>{s.title}</span>
                      <span className="text-xs text-slate-500">{locked ? "After the lessons" : s.meta}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <section className="min-w-0 rounded-3xl bg-white p-5 ring-1 ring-slate-200/70 sm:p-8">
          {onQuiz ? (
            <Quiz course={course} />
          ) : lesson ? (
            <>
              <p className="text-[13px] font-medium text-slate-500">
                Lesson {step + 1} of {course.lessons.length} · {lesson.minutes} min
              </p>
              <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight text-slate-900">{lesson.title}</h2>
              {lesson.video && embedUrl(lesson.video) && (
                <div className="mt-6 aspect-video overflow-hidden rounded-2xl bg-black">
                  <iframe src={embedUrl(lesson.video)!} title={lesson.title} className="h-full w-full" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" />
                </div>
              )}
              <div className="mt-6">{bodies[step]}</div>
              {error && (
                <p role="alert" className="mt-6 text-sm text-red-600">
                  {error}
                </p>
              )}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
                <button type="button" onClick={() => setStep((i) => Math.max(0, i - 1))} disabled={step === 0} className="h-11 rounded-full px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:invisible">
                  Previous
                </button>
                {step === course.lessons.length - 1 && !hasQuiz && doneIds.has(lesson.id) ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                    <Check size={16} /> Course complete
                  </span>
                ) : (
                  <button type="button" onClick={finishLesson} disabled={busy} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-brand-700 px-6 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
                    {busy && <Loader2 size={16} className="animate-spin" />}
                    {step === course.lessons.length - 1 ? (hasQuiz ? "Done, take the quiz" : "Finish course") : "Done, next lesson"}
                    {!busy && <ChevronRight size={16} />}
                  </button>
                )}
              </div>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function Quiz({ course }: { course: Course }) {
  const router = useRouter();
  const qs = course.quiz.questions;
  const [answers, setAnswers] = useState<(number | null)[]>(qs.map(() => null));
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const missing = answers.filter((a) => a === null).length;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await post<Result>(course.slug, { action: "quiz", answers });
      setResult(r);
      window.scrollTo({ top: 0, behavior: "smooth" });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="text-[13px] font-medium text-slate-500">
        {qs.length} questions · pass mark {course.quiz.passMark}%
      </p>
      <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight text-slate-900">Quiz</h2>

      {result ? (
        <div className={`mt-6 rounded-2xl p-5 ${result.passed ? "bg-emerald-50 ring-1 ring-emerald-200" : "bg-amber-50 ring-1 ring-amber-200"}`} role="status">
          <p className={`font-heading text-xl font-bold ${result.passed ? "text-emerald-900" : "text-amber-900"}`}>{result.passed ? `You passed with ${result.score}%` : `${result.score}%. Not quite there`}</p>
          <p className={`mt-1 text-sm ${result.passed ? "text-emerald-800" : "text-amber-800"}`}>
            {result.passed ? "Your certificate is ready." : `You need ${result.passMark}% to pass. Check the answers below, then try again.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {result.passed ? (
              <Link href={`/tutor/training/${course.slug}/certificate`} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800">
                <Award size={16} /> View certificate
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setAnswers(qs.map(() => null));
                }}
                className="inline-flex h-10 items-center rounded-full bg-amber-700 px-5 text-sm font-semibold text-white hover:bg-amber-800"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      ) : course.passed ? (
        <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
          You&apos;ve passed this quiz{course.best != null ? ` (best score ${course.best}%)` : ""}. You can take it again if you like.{" "}
          <Link href={`/tutor/training/${course.slug}/certificate`} className="font-semibold underline">
            View certificate
          </Link>
        </p>
      ) : null}

      <ol className="mt-6 space-y-5">
        {qs.map((q, qi) => {
          const r = result?.results[qi];
          return (
            <li key={qi}>
              <fieldset>
                <legend className="mb-2 text-[15px] font-semibold text-slate-900">
                  {qi + 1}. {q.question}
                </legend>
                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl ring-1 ring-slate-200">
                  {q.options.map((o, oi) => {
                    const value = oi + 1;
                    const chosen = answers[qi] === value;
                    const isAnswer = r && r.answer === value;
                    return (
                      <label
                        key={oi}
                        className={`flex cursor-pointer items-center gap-3 px-4 py-3 text-[15px] transition ${r ? (isAnswer ? "bg-emerald-50" : chosen ? "bg-red-50" : "") : chosen ? "bg-brand-50" : "hover:bg-slate-50"}`}
                      >
                        <input
                          type="radio"
                          name={`q${qi}`}
                          className="sr-only"
                          checked={chosen}
                          disabled={Boolean(result)}
                          onChange={() => setAnswers((a) => a.map((x, i) => (i === qi ? value : x)))}
                        />
                        <span className="min-w-0 flex-1 text-slate-800">{o}</span>
                        {r ? (
                          isAnswer ? (
                            <Check size={18} className="text-emerald-600" aria-label="Right answer" />
                          ) : chosen ? (
                            <X size={18} className="text-red-500" aria-label="Your answer" />
                          ) : null
                        ) : chosen ? (
                          <Check size={18} className="text-brand-600" aria-hidden="true" />
                        ) : null}
                      </label>
                    );
                  })}
                </div>
                {r?.explain && <p className="mt-2 px-1 text-sm text-slate-600">{r.explain}</p>}
              </fieldset>
            </li>
          );
        })}
      </ol>

      {!result && (
        <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-6">
          {error && (
            <p role="alert" className="mr-auto text-sm text-red-600">
              {error}
            </p>
          )}
          <span className="text-sm text-slate-500">{missing ? `${missing} left to answer` : "All answered"}</span>
          <button type="button" onClick={submit} disabled={busy || missing > 0} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-brand-700 px-6 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
            {busy && <Loader2 size={16} className="animate-spin" />}
            Check answers
          </button>
        </div>
      )}
    </div>
  );
}

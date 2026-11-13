"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, Loader2, RotateCcw, Sparkles, Star, Wand2 } from "lucide-react";
import { Combobox, type Option } from "@/components/ui/Combobox";
import { money } from "@/lib/money";

type Choice = { value: string; label: string; sub?: string };
type Result = {
  subject: { id: number; name: string; slug: string };
  total: number;
  currency: string;
  matches: {
    reasons: string[];
    tutor: { id: number; slug: string; name: string; headline: string; photo: string | null; hourlyRate: number; trialPrice: number | null; rating: number; reviewCount: number; lessonsTaught: number; country: string | null; verified: boolean; isSuperTutor: boolean };
  }[];
};
type Answers = { subjectId: number | null; level: string | null; goal: string | null; budget: number | null; times: string[]; languageId: number | null };

const KEY = "sabina.match";
const STEPS = ["subject", "level", "goal", "budget", "times"] as const;

function Tile({ on, label, sub, onClick }: { on: boolean; label: string; sub?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex min-h-[3.75rem] items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left ring-1 transition ${on ? "bg-brand-50 ring-2 ring-brand-600" : "bg-white ring-slate-200 hover:ring-brand-300"}`}
    >
      <span>
        <span className="block font-semibold text-slate-900">{label}</span>
        {sub && <span className="block text-sm text-slate-500">{sub}</span>}
      </span>
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition ${on ? "bg-brand-700 text-white" : "ring-1 ring-slate-300"}`}>{on && <Check size={14} strokeWidth={3} />}</span>
    </button>
  );
}

/**
 * Five quick questions (subject, who it's for, goal, budget, free times) and then the three
 * tutors who fit best, each with the reasons why.
 */
export function MatchQuiz({
  subjects,
  languages,
  levels,
  goals,
  times,
  currency,
  rateRange,
  initialSubject,
  defaultTimezone,
}: {
  subjects: Option<number>[];
  languages: Option<number>[];
  levels: Choice[];
  goals: Choice[];
  times: Choice[];
  currency: string;
  rateRange: [number, number];
  initialSubject: number | null;
  defaultTimezone: string | null;
}) {
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>({ subjectId: initialSubject, level: null, goal: null, budget: null, times: [], languageId: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  // Pick up where the visitor left off (this browser only).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Answers | null;
      if (saved) setA((cur) => ({ ...saved, subjectId: cur.subjectId ?? saved.subjectId }));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(a));
    } catch {}
  }, [a]);

  const budgets = useMemo(() => {
    const [lo, hi] = rateRange;
    const steps = [0.15, 0.25, 0.4, 0.6].map((f) => Math.max(lo, Math.round((lo + (hi - lo) * f) / 5) * 5));
    return Array.from(new Set(steps));
  }, [rateRange]);

  const current = STEPS[step]!;
  const canNext = current === "subject" ? a.subjectId != null : current === "level" ? a.level != null : true;

  async function finish() {
    setBusy(true);
    setError(null);
    const tz = defaultTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res = await fetch("/api/match", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...a, timezone: tz }) }).catch(() => null);
    const d = (await res?.json().catch(() => null)) as (Result & { error?: string }) | null;
    setBusy(false);
    if (!res?.ok || !d?.matches) return setError(d?.error || "We couldn't find matches just now. Please try again.");
    setResult(d);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (result) {
    const filters = new URLSearchParams({ ...(a.level ? { level: a.level } : {}), ...(a.budget ? { max: String(a.budget) } : {}) }).toString();
    return (
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-800 ring-1 ring-brand-100">
            <Sparkles size={15} /> Your matches
          </span>
          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {result.matches.length ? `${result.matches.length === 1 ? "The tutor" : `${result.matches.length} tutors`} we'd pick for ${result.subject.name}` : `No ${result.subject.name} tutors yet`}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            {result.matches.length ? "Chosen for your level, budget and the times you're free. Start with a trial lesson to see how you get on." : "We're adding tutors all the time. Try another subject, or browse everyone."}
          </p>
        </div>

        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {result.matches.map((m, i) => (
            <li key={m.tutor.id} className={`relative flex flex-col rounded-3xl bg-white p-5 ring-1 sm:p-6 ${i === 0 ? "shadow-[0_20px_50px_-30px_rgba(20,32,156,0.5)] ring-2 ring-brand-600" : "ring-slate-200/70"}`}>
              {i === 0 && <span className="absolute -top-3 left-5 rounded-full bg-brand-700 px-3 py-1 text-xs font-semibold text-white">Best match</span>}
              <div className="flex items-center gap-3">
                {m.tutor.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.tutor.photo} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                ) : (
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-700 text-xl font-bold text-white">{m.tutor.name.charAt(0)}</span>
                )}
                <div className="min-w-0">
                  <p className="flex items-center gap-1 truncate font-heading text-lg font-bold text-slate-900">
                    {m.tutor.name} {m.tutor.verified && <BadgeCheck size={17} className="shrink-0 text-brand-600" aria-label="Verified" />}
                  </p>
                  <p className="flex items-center gap-1 text-sm text-slate-500">
                    {m.tutor.reviewCount ? (
                      <>
                        <Star size={14} className="fill-amber-400 text-amber-400" /> <b className="text-slate-800">{m.tutor.rating.toFixed(1)}</b> ({m.tutor.reviewCount})
                      </>
                    ) : (
                      "New tutor"
                    )}
                    {m.tutor.country ? ` · ${m.tutor.country}` : ""}
                  </p>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-700">{m.tutor.headline}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {m.reasons.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-slate-700">
                    <Check size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-emerald-600" /> {r}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-5">
                <p className="font-heading text-2xl font-bold text-slate-900">
                  {money(m.tutor.hourlyRate, result.currency)} <span className="text-sm font-normal text-slate-500">an hour</span>
                </p>
                <div className="mt-3 grid gap-2">
                  <Link href={`/tutors/${m.tutor.slug}/book${m.tutor.trialPrice != null ? "?type=trial" : ""}`} className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-700 font-semibold text-white hover:bg-brand-800">
                    {m.tutor.trialPrice != null ? `Book a trial · ${money(m.tutor.trialPrice, result.currency)}` : "Book a lesson"}
                  </Link>
                  <Link href={`/tutors/${m.tutor.slug}`} className="inline-flex h-11 items-center justify-center rounded-xl font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
                    View profile
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {result.total > result.matches.length && (
            <Link href={`/find-tutors?subject=${result.subject.slug}${filters ? `&${filters}` : ""}`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 font-semibold text-white hover:bg-slate-800">
              See all {result.total} {result.subject.name} tutors <ArrowRight size={17} />
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setStep(0);
            }}
            className="inline-flex h-11 items-center gap-2 rounded-xl px-5 font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <RotateCcw size={16} /> Change my answers
          </button>
        </div>
      </div>
    );
  }

  const title: Record<(typeof STEPS)[number], string> = {
    subject: "What do you want to learn?",
    level: "Who are the lessons for?",
    goal: "What's the main goal?",
    budget: "What's your budget per hour?",
    times: "When are you usually free?",
  };
  const sub: Record<(typeof STEPS)[number], string> = {
    subject: "Pick one subject. You can always book other tutors later.",
    level: "So we suggest tutors who teach at the right level.",
    goal: "Optional, but it helps us choose.",
    budget: `In ${currency}. Pick the most you'd like to pay.`,
    times: "In your own time zone. Choose all that apply.",
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-semibold text-brand-800 ring-1 ring-brand-100">
          <Wand2 size={15} /> Find your tutor in a minute
        </span>
      </div>
      <div className="mt-6 flex items-center gap-3" aria-hidden="true">
        {STEPS.map((s, i) => (
          <span key={s} className={`h-1.5 flex-1 rounded-full transition ${i <= step ? "bg-brand-600" : "bg-slate-200"}`} />
        ))}
      </div>
      <p className="mt-3 text-center text-sm text-slate-500">
        Question {step + 1} of {STEPS.length}
      </p>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/70 sm:p-8" aria-live="polite">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title[current]}</h1>
        <p className="mt-1 text-slate-600">{sub[current]}</p>

        <div className="mt-6">
          {current === "subject" && (
            <div className="space-y-4">
              <Combobox aria-label="Subject" options={subjects} value={a.subjectId} onChange={(v) => setA({ ...a, subjectId: v })} placeholder="Choose a subject" searchPlaceholder="Search subjects, e.g. Chemistry" />
              <div>
                <span className="text-sm font-semibold text-slate-800">Lessons in a language other than English? (optional)</span>
                <Combobox aria-label="Lesson language" className="mt-1.5" options={languages} value={a.languageId} onChange={(v) => setA({ ...a, languageId: v })} placeholder="Any language" searchPlaceholder="Search languages" clearable />
              </div>
            </div>
          )}
          {current === "level" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {levels.map((l) => (
                <Tile key={l.value} on={a.level === l.value} label={l.label} onClick={() => setA({ ...a, level: l.value })} />
              ))}
            </div>
          )}
          {current === "goal" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {goals.map((g) => (
                <Tile key={g.value} on={a.goal === g.value} label={g.label} onClick={() => setA({ ...a, goal: a.goal === g.value ? null : g.value })} />
              ))}
            </div>
          )}
          {current === "budget" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {budgets.map((b) => (
                <Tile key={b} on={a.budget === b} label={`Up to ${money(b, currency)}`} onClick={() => setA({ ...a, budget: b })} />
              ))}
              <Tile on={a.budget == null} label="Any price" sub="Show me the best fit" onClick={() => setA({ ...a, budget: null })} />
            </div>
          )}
          {current === "times" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {times.map((t) => (
                <Tile key={t.value} on={a.times.includes(t.value)} label={t.label} sub={t.sub} onClick={() => setA({ ...a, times: a.times.includes(t.value) ? a.times.filter((x) => x !== t.value) : [...a.times, t.value] })} />
              ))}
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-5 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="inline-flex h-12 items-center gap-1.5 rounded-xl px-4 font-semibold text-slate-600 hover:bg-slate-100 disabled:invisible">
            <ArrowLeft size={18} /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="inline-flex h-12 items-center gap-1.5 rounded-xl bg-brand-700 px-6 font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
              {current === "goal" && !a.goal ? "Skip" : "Next"} <ArrowRight size={18} />
            </button>
          ) : (
            <button type="button" onClick={finish} disabled={busy} className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-700 px-6 font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} Show my matches
            </button>
          )}
        </div>
      </section>
      <p className="mt-5 text-center text-sm text-slate-500">
        Prefer to look around? <Link href="/find-tutors" className="font-semibold text-brand-700 hover:underline">Browse all tutors</Link>
      </p>
    </div>
  );
}

"use client";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { HIGHLIGHTS } from "@/cms/reviews/highlights";
import { Stars } from "./Stars";

const PROMPT = ["", "What went wrong?", "What could have been better?", "What was OK, and what wasn't?", "What did you like?", "What made it great?"];
const WORD = ["", "Poor", "Not great", "OK", "Good", "Excellent"];

/**
 * Rate a lesson: stars first (one tap), then optional highlights and a comment. Used in the
 * classroom when the lesson ends (dark), on the lesson page and on the student's home page.
 */
export function RateLesson({ lessonId, tutor, dark = false, onDone, heading = true }: { lessonId: number; tutor: string; dark?: boolean; onDone?: () => void; heading?: boolean }) {
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const first = tutor.split(" ")[0];
  const muted = dark ? "text-white/60" : "text-slate-500";

  const send = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/lessons/${lessonId}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "review", rating, comment, highlights: tags }) }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res?.ok) return setError(data.error ?? "We couldn't save your rating. Check your connection and try again.");
    setDone(true);
    onDone?.();
  };

  if (done)
    return (
      <div role="status" className={`flex items-center gap-3 ${dark ? "text-white" : "text-slate-900"}`}>
        <CheckCircle2 className="shrink-0 text-emerald-500" size={26} />
        <div>
          <p className="font-semibold">Thanks for rating your lesson</p>
          <p className={`text-sm ${muted}`}>Your review now helps other students choose.</p>
        </div>
      </div>
    );

  return (
    <div data-testid="rate-lesson">
      {heading && (
        <>
          <p className={`font-semibold ${dark ? "text-white" : "text-slate-900"}`}>How was your lesson with {first}?</p>
          <p className={`mt-0.5 text-sm ${muted}`}>Tap a star. Only your first name is shown.</p>
        </>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Stars value={rating} onChange={setRating} size={34} dark={dark} />
        {rating > 0 && <span className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-700"}`}>{WORD[rating]}</span>}
      </div>
      {rating > 0 && (
        <div className="mt-4 space-y-4">
          {rating >= 4 && (
            <fieldset>
              <legend className={`text-sm font-medium ${dark ? "text-white/80" : "text-slate-700"}`}>What stood out? (optional)</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {HIGHLIGHTS.map((h) => {
                  const on = tags.includes(h.value);
                  return (
                    <button
                      key={h.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setTags((t) => (on ? t.filter((x) => x !== h.value) : [...t, h.value]))}
                      className={`h-9 rounded-full px-3.5 text-sm font-medium ring-1 transition ${on ? "bg-brand-700 text-white ring-brand-700" : dark ? "bg-white/5 text-white ring-white/20 hover:bg-white/10" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"}`}
                    >
                      {h.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}
          <label className="block">
            <span className={`text-sm font-medium ${dark ? "text-white/80" : "text-slate-700"}`}>{PROMPT[rating]} (optional)</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={1500}
              className={`mt-1.5 w-full rounded-2xl border-0 px-4 py-3 text-[15px] ring-1 focus:ring-2 ${dark ? "bg-white/10 text-white ring-white/15 placeholder:text-white/40 focus:ring-accent-400" : "bg-slate-50 text-slate-900 ring-slate-200 focus:ring-brand-500"}`}
            />
          </label>
          {error && <p className="text-sm font-medium text-rose-500">{error}</p>}
          <button type="button" disabled={busy} onClick={() => void send()} className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-700 px-6 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
            {busy && <Loader2 size={16} className="animate-spin" />} Post rating
          </button>
        </div>
      )}
    </div>
  );
}

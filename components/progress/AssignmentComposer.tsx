"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardList, ListChecks, Loader2, Plus, Trash2, X } from "lucide-react";
import { TextInput } from "@/components/auth/fields";
import { RichTextArea, controlCls } from "@/components/portal/form";
import type { Lexical } from "@/cms/content/rich";

type Q = { prompt: string; type: "choice" | "short"; options: string[]; correct: number | null; accepted: string; explanation: string };
const blank = (): Q => ({ prompt: "", type: "choice", options: ["", ""], correct: null, accepted: "", explanation: "" });

/** Set homework or build a short quiz for one student. */
export function AssignmentComposer({ studentId, studentName }: { studentId: number; studentName: string }) {
  const router = useRouter();
  const [kind, setKind] = useState<"homework" | "quiz" | null>(null);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState<Lexical | null>(null);
  const [due, setDue] = useState("");
  const [qs, setQs] = useState<Q[]>([blank()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const reset = () => {
    setKind(null);
    setTitle("");
    setInstructions(null);
    setDue("");
    setQs([blank()]);
    setError(null);
  };
  const upQ = (i: number, patch: Partial<Q>) => setQs(qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));

  async function save() {
    setBusy(true);
    setError(null);
    const body = {
      studentId,
      kind,
      title,
      instructions,
      dueAt: due ? new Date(due).toISOString() : null,
      questions: kind === "quiz" ? qs.map((q) => ({ prompt: q.prompt, type: q.type, options: q.options, correct: q.correct ?? -1, accepted: q.accepted, explanation: q.explanation })) : undefined,
    };
    const res = await fetch("/api/homework", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const d = (await res?.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res?.ok) return setError(d.error || "We couldn't save that. Please try again.");
    setDone(kind === "quiz" ? `Quiz sent to ${studentName}.` : `Homework sent to ${studentName}.`);
    reset();
    router.refresh();
  }

  if (!kind)
    return (
      <div className="space-y-3">
        {done && (
          <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            <CheckCircle2 size={16} /> {done} They&apos;ll get an email.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => (setKind("homework"), setDone(null))} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800">
            <ClipboardList size={17} /> Set homework
          </button>
          <button type="button" onClick={() => (setKind("quiz"), setDone(null))} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
            <ListChecks size={17} /> Create a quiz
          </button>
        </div>
      </div>
    );

  return (
    <div className="space-y-5 rounded-2xl bg-slate-50/70 p-4 ring-1 ring-slate-200 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-lg font-bold text-slate-900">{kind === "quiz" ? "New quiz" : "New homework"}</h3>
        <button type="button" onClick={reset} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-white">
          <X size={18} />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <TextInput label="Title" value={title} maxLength={140} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "quiz" ? "Forces and motion check" : "Practice paper 2, questions 1–5"} />
        <TextInput label="Due (optional)" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
      </div>
      <RichTextArea label={kind === "quiz" ? "Note for the student (optional)" : "Instructions"} value={instructions} onChange={setInstructions} maxLength={4000} placeholder={kind === "quiz" ? "Try these without your notes." : "What should they do, and how should they hand it in?"} minHeight={120} />

      {kind === "quiz" && (
        <div className="space-y-4">
          {qs.map((q, i) => (
            <fieldset key={i} className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <legend className="sr-only">Question {i + 1}</legend>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800">Question {i + 1}</span>
                <div className="flex items-center gap-1">
                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold" role="radiogroup" aria-label={`Question ${i + 1} type`}>
                    {(["choice", "short"] as const).map((t) => (
                      <button key={t} type="button" role="radio" aria-checked={q.type === t} onClick={() => upQ(i, { type: t })} className={`rounded-md px-2.5 py-1 ${q.type === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
                        {t === "choice" ? "Multiple choice" : "Short answer"}
                      </button>
                    ))}
                  </div>
                  {qs.length > 1 && (
                    <button type="button" onClick={() => setQs(qs.filter((_, j) => j !== i))} aria-label={`Remove question ${i + 1}`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <textarea aria-label={`Question ${i + 1}`} value={q.prompt} onChange={(e) => upQ(i, { prompt: e.target.value })} rows={2} maxLength={600} placeholder="What is the unit of force?" className={`${controlCls} py-2.5 text-sm`} />
              {q.type === "choice" ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Tick the right answer.</p>
                  {q.options.map((o, k) => (
                    <div key={k} className="flex items-center gap-2">
                      <input type="radio" name={`q${i}-correct`} checked={q.correct === k} onChange={() => upQ(i, { correct: k })} aria-label={`Choice ${k + 1} is right`} className="h-4 w-4 accent-emerald-600" />
                      <input aria-label={`Question ${i + 1} choice ${k + 1}`} value={o} maxLength={200} onChange={(e) => upQ(i, { options: q.options.map((x, j) => (j === k ? e.target.value : x)) })} placeholder={`Choice ${k + 1}`} className={`${controlCls} h-10 text-sm`} />
                      {q.options.length > 2 && (
                        <button type="button" onClick={() => upQ(i, { options: q.options.filter((_, j) => j !== k), correct: q.correct === k ? null : q.correct !== null && q.correct > k ? q.correct - 1 : q.correct })} aria-label={`Remove choice ${k + 1}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                  {q.options.length < 6 && (
                    <button type="button" onClick={() => upQ(i, { options: [...q.options, ""] })} className="text-sm font-semibold text-brand-700 hover:underline">
                      + Add a choice
                    </button>
                  )}
                </div>
              ) : (
                <TextInput label="Accepted answers" hint="Separate different correct answers with |, e.g. newton | N. Not case-sensitive." value={q.accepted} maxLength={300} onChange={(e) => upQ(i, { accepted: e.target.value })} />
              )}
              <TextInput label="Explanation (optional)" hint="Shown after they finish." value={q.explanation} maxLength={600} onChange={(e) => upQ(i, { explanation: e.target.value })} />
            </fieldset>
          ))}
          {qs.length < 30 && (
            <button type="button" onClick={() => setQs([...qs, blank()])} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50">
              <Plus size={16} /> Add a question
            </button>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={save} disabled={busy || !title.trim()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
          {busy && <Loader2 size={16} className="animate-spin" />} Send to {studentName.split(" ")[0]}
        </button>
        <button type="button" onClick={reset} className="inline-flex h-11 items-center rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-white">
          Cancel
        </button>
      </div>
    </div>
  );
}

"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, Paperclip, Send, X } from "lucide-react";
import { RichTextArea, controlCls } from "@/components/portal/form";
import type { Lexical } from "@/cms/content/rich";

async function post(id: number, body: unknown) {
  const res = await fetch(`/api/homework/${id}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  const d = (await res?.json().catch(() => ({}))) as { error?: string };
  return { ok: Boolean(res?.ok), error: d.error };
}

/** Student: write an answer and/or attach photos or PDFs, then hand in. */
export function HandIn({ id }: { id: number }) {
  const router = useRouter();
  const [answer, setAnswer] = useState<Lexical | null>(null);
  const [files, setFiles] = useState<{ id: number; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function upload(list: FileList) {
    setUploading(true);
    setError(null);
    for (const f of Array.from(list).slice(0, 5 - files.length)) {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/homework/upload", { method: "POST", credentials: "include", body: fd }).catch(() => null);
      const d = (await res?.json().catch(() => ({}))) as { id?: number; name?: string; error?: string };
      if (!res?.ok || !d.id) {
        setError(d.error || `We couldn't upload ${f.name}.`);
        break;
      }
      setFiles((cur) => [...cur, { id: d.id!, name: d.name ?? f.name }]);
    }
    setUploading(false);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const r = await post(id, { action: "submit", answer, files: files.map((f) => f.id) });
    setBusy(false);
    if (!r.ok) return setError(r.error || "We couldn't hand that in. Please try again.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <RichTextArea label="Your answer" value={answer} onChange={setAnswer} maxLength={8000} placeholder="Type your answer here, or attach a photo of your work below." minHeight={160} />
      <div>
        <p className="text-sm font-semibold text-slate-800">Files (optional)</p>
        <p className="text-xs text-slate-500">Photos of written work or PDFs, up to 5 files of 10 MB each. Only your tutor can see them.</p>
        {files.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {files.map((f) => (
              <li key={f.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200">
                <Paperclip size={15} className="shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1 truncate text-slate-700">{f.name}</span>
                <button type="button" onClick={() => setFiles(files.filter((x) => x.id !== f.id))} aria-label={`Remove ${f.name}`} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-white">
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" className="hidden" onChange={(e) => e.target.files && upload(e.target.files)} aria-label="Add files" />
        {files.length < 5 && (
          <button type="button" onClick={() => input.current?.click()} disabled={uploading} className="mt-2 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />} {uploading ? "Uploading…" : "Add a photo or PDF"}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
      <button type="button" onClick={submit} disabled={busy || uploading} className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-700 px-6 font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
        {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} />} Hand in
      </button>
    </div>
  );
}

/** Student: answer the quiz, then see the score. */
export function TakeQuiz({ id, questions }: { id: number; questions: { prompt: string; type: "choice" | "short"; options: string[] }[] }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<(number | string | null)[]>(questions.map(() => null));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const left = answers.filter((a) => a == null || a === "").length;

  async function finish() {
    if (left && !window.confirm(`You haven't answered ${left} ${left === 1 ? "question" : "questions"}. Finish anyway?`)) return;
    setBusy(true);
    setError(null);
    const r = await post(id, { action: "submit", responses: answers });
    setBusy(false);
    if (!r.ok) return setError(r.error || "We couldn't save your answers. Please try again.");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <ol className="space-y-4">
        {questions.map((q, i) => (
          <li key={i} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
            <fieldset>
              <legend className="font-semibold text-slate-900">
                <span className="mr-1.5 text-slate-400">{i + 1}.</span>
                <span className="whitespace-pre-wrap">{q.prompt}</span>
              </legend>
              {q.type === "choice" ? (
                <div className="mt-3 grid gap-2">
                  {q.options.map((o, k) => (
                    <label key={k} className={`flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3 text-sm ring-1 transition ${answers[i] === k ? "bg-brand-50 ring-2 ring-brand-600" : "ring-slate-200 hover:ring-brand-300"}`}>
                      <input type="radio" name={`q${i}`} checked={answers[i] === k} onChange={() => setAnswers(answers.map((a, j) => (j === i ? k : a)))} className="h-4 w-4 accent-brand-700" />
                      <span className="text-slate-800">{o}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input aria-label={`Answer to question ${i + 1}`} value={String(answers[i] ?? "")} maxLength={300} onChange={(e) => setAnswers(answers.map((a, j) => (j === i ? e.target.value : a)))} placeholder="Your answer" className={`${controlCls} mt-3 h-11`} />
              )}
            </fieldset>
          </li>
        ))}
      </ol>
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={finish} disabled={busy} className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-700 px-6 font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
          {busy && <Loader2 size={18} className="animate-spin" />} Finish quiz
        </button>
        <span className="text-sm text-slate-500">{left ? `${left} of ${questions.length} still to answer` : "All answered"}</span>
      </div>
    </div>
  );
}

/** Tutor: feedback on handed-in work (or a finished quiz). */
export function GiveFeedback({ id, hasFeedback }: { id: number; hasFeedback: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(!hasFeedback);
  const [feedback, setFeedback] = useState<Lexical | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50">
        Update feedback
      </button>
    );
  async function save() {
    setBusy(true);
    setError(null);
    const r = await post(id, { action: "review", feedback });
    setBusy(false);
    if (!r.ok) return setError(r.error || "We couldn't save your feedback.");
    setOpen(false);
    router.refresh();
  }
  return (
    <div className="space-y-3">
      <RichTextArea label="Feedback" value={feedback} onChange={setFeedback} maxLength={4000} placeholder="What went well, and what to work on next." minHeight={140} />
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
      <button type="button" onClick={save} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
        {busy && <Loader2 size={16} className="animate-spin" />} Send feedback
      </button>
    </div>
  );
}

/** Tutor: remove homework nobody has handed in yet. */
export function RemoveHomework({ id, back }: { id: number; back: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!window.confirm("Remove this? The student won't see it any more.")) return;
        setBusy(true);
        await fetch(`/api/homework/${id}`, { method: "DELETE", credentials: "include" }).catch(() => null);
        router.push(back);
        router.refresh();
      }}
      className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50 disabled:opacity-50"
    >
      Remove
    </button>
  );
}

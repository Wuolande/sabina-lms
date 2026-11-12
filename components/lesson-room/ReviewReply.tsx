"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

/** A tutor's public reply under a review. */
export function ReviewReply({ id, initial }: { id: number; initial: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  if (!open)
    return initial ? (
      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
        <span className="font-semibold text-slate-800">Your reply:</span> {initial}{" "}
        <button type="button" onClick={() => setOpen(true)} className="font-semibold text-brand-700 hover:underline">
          Edit
        </button>
      </div>
    ) : (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 text-sm font-semibold text-brand-700 hover:underline">
        Reply
      </button>
    );
  return (
    <div className="mt-3">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={1000} aria-label="Your reply" placeholder="Thank them, or answer a point they raised. Everyone can see your reply." className="w-full rounded-2xl border-0 bg-slate-50 px-4 py-3 text-[15px] ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500" />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await fetch(`/api/reviews/${id}/reply`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reply: text }) }).catch(() => null);
            setBusy(false);
            setOpen(false);
            router.refresh();
          }}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {busy && <Loader2 size={15} className="animate-spin" />} Post reply
        </button>
        <button type="button" onClick={() => (setOpen(false), setText(initial))} className="h-10 rounded-full px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </div>
  );
}

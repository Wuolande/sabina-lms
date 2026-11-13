"use client";
import { useState } from "react";
import { Check, Copy, Link2, Loader2, ShieldCheck } from "lucide-react";

/** Create, copy, replace or turn off the private link a parent can open. */
export function ParentShare({ initialPath }: { initialPath: string | null }) {
  const [path, setPath] = useState(initialPath);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = path && typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

  async function make() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/student/share", { method: "POST", credentials: "include" }).catch(() => null);
    const d = (await res?.json().catch(() => ({}))) as { path?: string; error?: string };
    setBusy(false);
    if (!res?.ok || !d.path) return setError(d.error || "We couldn't make a link. Please try again.");
    setPath(d.path);
    setCopied(false);
  }
  async function off() {
    if (!window.confirm("Turn off the link? Anyone who has it won't be able to open it any more.")) return;
    setBusy(true);
    await fetch("/api/student/share", { method: "DELETE", credentials: "include" }).catch(() => null);
    setBusy(false);
    setPath(null);
  }

  return (
    <div className="space-y-3">
      <p className="flex items-start gap-2 text-sm text-slate-600">
        <ShieldCheck size={17} className="mt-0.5 shrink-0 text-emerald-600" />A private, read-only page with your lessons, attendance, homework and goals. It never shows messages, payments or contact details.
      </p>
      {path ? (
        <>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200">
            <Link2 size={16} className="ml-1 shrink-0 text-slate-400" />
            <input readOnly value={url ?? ""} aria-label="Parent link" onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none" />
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url ?? "");
                  setCopied(true);
                } catch {}
              }}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
            >
              {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <a href={path} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 hover:underline">
              Preview
            </a>
            <span className="text-slate-300">·</span>
            <button type="button" onClick={make} disabled={busy} className="font-semibold text-slate-600 hover:underline">
              Make a new link
            </button>
            <span className="text-slate-300">·</span>
            <button type="button" onClick={off} disabled={busy} className="font-semibold text-rose-700 hover:underline">
              Turn off
            </button>
          </div>
        </>
      ) : (
        <button type="button" onClick={make} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />} Create a parent link
        </button>
      )}
      {error && (
        <p role="alert" className="text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}

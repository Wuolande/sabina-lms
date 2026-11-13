"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { FileImage, FileSpreadsheet, FileText, Loader2, Presentation, Trash2, Upload } from "lucide-react";

export type LessonFile = { id: number; name: string; url: string | null; size: number; type: string; mine: boolean; at: string };

const iconFor = (t: string) => (t.startsWith("image/") ? FileImage : t.includes("sheet") || t.includes("excel") ? FileSpreadsheet : t.includes("presentation") || t.includes("powerpoint") ? Presentation : FileText);
const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/**
 * Files shared in a lesson: upload, open, remove your own. `refreshKey` changes when the other
 * person shares something, so the list reloads.
 */
export function LessonFiles({ lessonId, dark = false, refreshKey = 0, onShared }: { lessonId: number; dark?: boolean; refreshKey?: number; onShared?: () => void }) {
  const [files, setFiles] = useState<LessonFile[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/lessons/${lessonId}/files`, { credentials: "include", cache: "no-store" }).catch(() => null);
    const d = (await res?.json().catch(() => null)) as { files?: LessonFile[] } | null;
    setFiles(d?.files ?? []);
  }, [lessonId]);
  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function upload(list: FileList) {
    setBusy(true);
    setError(null);
    for (const f of Array.from(list).slice(0, 5)) {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch(`/api/lessons/${lessonId}/files`, { method: "POST", credentials: "include", body: fd }).catch(() => null);
      const d = (await res?.json().catch(() => ({}))) as LessonFile & { error?: string };
      if (!res?.ok) {
        setError(d.error || `We couldn't share ${f.name}.`);
        break;
      }
      setFiles((cur) => [...(cur ?? []), d]);
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    onShared?.();
  }
  async function remove(f: LessonFile) {
    if (!window.confirm(`Remove ${f.name}?`)) return;
    await fetch(`/api/lessons/${lessonId}/files?file=${f.id}`, { method: "DELETE", credentials: "include" }).catch(() => null);
    setFiles((cur) => (cur ?? []).filter((x) => x.id !== f.id));
    onShared?.();
  }

  const row = dark ? "bg-white/5 hover:bg-white/10" : "bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100";
  const muted = dark ? "text-white/50" : "text-slate-500";
  return (
    <div className="space-y-3">
      {files === null ? (
        <p className={`flex items-center gap-2 text-sm ${muted}`}>
          <Loader2 size={15} className="animate-spin" /> Loading files…
        </p>
      ) : files.length ? (
        <ul className="space-y-2">
          {files.map((f) => {
            const Icon = iconFor(f.type);
            return (
              <li key={f.id} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition ${row}`}>
                <Icon size={20} className={dark ? "shrink-0 text-[#64d2ff]" : "shrink-0 text-brand-600"} />
                <a href={f.url ?? "#"} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{f.name}</span>
                  <span className={`block text-xs ${muted}`}>
                    {kb(f.size)}
                    {f.mine ? " · shared by you" : ""}
                  </span>
                </a>
                {f.mine && (
                  <button type="button" onClick={() => remove(f)} aria-label={`Remove ${f.name}`} className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${dark ? "text-white/50 hover:bg-white/10" : "text-slate-400 hover:bg-white"}`}>
                    <Trash2 size={15} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={`text-sm ${muted}`}>No files yet. Share worksheets, past papers or notes here; they stay with the lesson afterwards.</p>
      )}
      <input
        ref={input}
        type="file"
        multiple
        className="hidden"
        aria-label="Share files"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
        onChange={(e) => e.target.files?.length && upload(e.target.files)}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold disabled:opacity-60 ${dark ? "bg-[#0a84ff] text-white" : "bg-brand-700 text-white hover:bg-brand-800"}`}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} {busy ? "Sharing…" : "Share a file"}
      </button>
      <p className={`text-xs ${muted}`}>PDF, photos, Word, PowerPoint, Excel or text, up to 20 MB. Only you two can open them.</p>
      {error && (
        <p role="alert" className={`text-sm font-medium ${dark ? "text-[#ff6961]" : "text-rose-700"}`}>
          {error}
        </p>
      )}
    </div>
  );
}

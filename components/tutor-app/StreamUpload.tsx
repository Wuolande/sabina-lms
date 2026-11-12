"use client";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";

/**
 * Upload an intro video straight to Cloudflare Stream. We ask our API for a one-time upload URL,
 * then send the file from the browser with progress. On success the Stream player link is returned.
 */
export function StreamUpload({ disabled, onUploaded }: { disabled?: boolean; onUploaded: (watchUrl: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (!file.type.startsWith("video/")) return setError("Choose a video file (MP4, MOV or WebM).");
    if (file.size > 200 * 1024 * 1024) return setError("That file is over 200 MB. Try a shorter clip or a lower resolution.");
    setProgress(0);
    const res = await fetch("/api/tutor/video-upload", { method: "POST", credentials: "include" }).catch(() => null);
    const d = (await res?.json().catch(() => ({}))) as { uploadURL?: string; watchUrl?: string; error?: string };
    if (!res?.ok || !d.uploadURL || !d.watchUrl) {
      setProgress(null);
      return setError(d.error || "We couldn't start the upload. Please try again.");
    }
    const form = new FormData();
    form.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", d.uploadURL);
    xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      setProgress(null);
      if (xhr.status >= 200 && xhr.status < 300) onUploaded(d.watchUrl!);
      else setError("The upload didn't finish. Please try again.");
    };
    xhr.onerror = () => {
      setProgress(null);
      setError("The upload was interrupted. Check your connection and try again.");
    };
    xhr.send(form);
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 p-5 text-center">
      <input ref={input} type="file" accept="video/mp4,video/quicktime,video/webm" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      {progress != null ? (
        <div>
          <p className="text-sm font-semibold text-slate-800">Uploading… {progress}%</p>
          <span className="mt-2 block h-2 overflow-hidden rounded-full bg-slate-100">
            <span className="block h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
          </span>
          <p className="mt-2 text-xs text-slate-500">Keep this page open until it finishes.</p>
        </div>
      ) : (
        <>
          <button type="button" disabled={disabled} onClick={() => input.current?.click()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50">
            <Upload size={17} /> Upload a video
          </button>
          <p className="mt-2 text-xs text-slate-500">MP4, MOV or WebM, up to 3 minutes and 200 MB.</p>
        </>
      )}
      {error && <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>}
    </div>
  );
}

"use client";
import { useState } from "react";
import { Heart } from "lucide-react";

/** Save / unsave a tutor. Signed-out visitors are sent to sign in first. */
export function SaveTutorButton({ tutorId, initialSaved = false, signedIn, variant = "icon" }: { tutorId: number; initialSaved?: boolean; signedIn: boolean; variant?: "icon" | "full" }) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!signedIn) {
      window.location.assign(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    setBusy(true);
    const next = !saved;
    setSaved(next);
    const res = await fetch("/api/student/favorites", { method: next ? "POST" : "DELETE", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tutorId }) }).catch(() => null);
    if (!res?.ok) setSaved(!next);
    setBusy(false);
  }
  const label = saved ? "Saved" : "Save tutor";
  if (variant === "full")
    return (
      <button type="button" onClick={toggle} disabled={busy} aria-pressed={saved} className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold ring-1 transition ${saved ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"}`}>
        <Heart size={18} className={saved ? "fill-rose-500 text-rose-500" : ""} /> {label}
      </button>
    );
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={`grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-sm ring-1 backdrop-blur transition ${saved ? "text-rose-500 ring-rose-200" : "text-slate-500 ring-slate-200 hover:text-rose-500"}`}
    >
      <Heart size={18} className={saved ? "fill-rose-500" : ""} />
    </button>
  );
}

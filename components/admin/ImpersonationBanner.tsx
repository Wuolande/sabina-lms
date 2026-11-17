"use client";
import { useEffect, useState } from "react";
import { Eye, Loader2 } from "lucide-react";

type Viewing = { name: string; role: string; id: number };

/** Shown on every page while an admin is logged in as a student or tutor, with a way back. */
export function ImpersonationBanner() {
  const [viewing, setViewing] = useState<Viewing | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const raw = document.cookie.split("; ").find((c) => c.startsWith("sb_imp="));
    if (!raw) return;
    try {
      setViewing(JSON.parse(decodeURIComponent(raw.slice(7))) as Viewing);
    } catch {
      /* ignore a malformed cookie */
    }
  }, []);

  if (!viewing) return null;

  async function back() {
    setBusy(true);
    const res = await fetch("/api/admin/impersonate/stop", { method: "POST", credentials: "include", headers: { "Sec-Fetch-Site": "same-origin" } }).catch(() => null);
    const d = (await res?.json().catch(() => ({}))) as { redirectTo?: string };
    window.location.assign(d.redirectTo ?? "/admin");
  }

  return (
    <div role="status" className="sticky top-0 z-[100] flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-accent-400 px-4 py-2 text-sm text-slate-900 shadow">
      <span className="flex items-center gap-2">
        <Eye size={16} className="shrink-0" />
        <span>
          You&apos;re logged in as <b>{viewing.name}</b> ({viewing.role}). Anything you do here is real.
        </span>
      </span>
      <button type="button" onClick={back} disabled={busy} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
        {busy && <Loader2 size={14} className="animate-spin" />} Back to admin
      </button>
    </div>
  );
}

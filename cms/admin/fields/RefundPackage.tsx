"use client";
import { useState } from "react";
import { useDocumentInfo } from "@payloadcms/ui";

/** "Refund unused lessons" on a lesson package in the admin. Lessons already booked stay booked. */
export function RefundPackage() {
  const { id, savedDocumentData } = useDocumentInfo();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const status = String(savedDocumentData?.status ?? "");
  if (!id || !["active", "used_up", "expired"].includes(status)) return null;

  async function run() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/cms/lesson-packages/${id}/refund-unused`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: d.errors?.[0]?.message ?? d.error ?? "That didn't work." });
    setMsg({ ok: true, text: d.message });
    setTimeout(() => window.location.reload(), 1200);
  }

  return (
    <div className="sb-refund-package" style={{ marginBottom: 24 }}>
      {!open ? (
        <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => setOpen(true)}>
          Refund unused lessons
        </button>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <label htmlFor="refund-reason" style={{ fontWeight: 600 }}>
            Why are we refunding?
          </label>
          <textarea id="refund-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. The student is moving abroad" style={{ width: "100%", padding: 8, borderRadius: 8 }} />
          <p style={{ margin: 0, fontSize: 13, opacity: 0.75 }}>The student gets back what the unused lessons cost. Lessons already booked stay booked.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn--style-primary btn--size-small" disabled={busy || !reason.trim()} onClick={run}>
              {busy ? "Refunding…" : "Refund now"}
            </button>
            <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {msg && (
        <p role={msg.ok ? "status" : "alert"} style={{ marginTop: 8, color: msg.ok ? "var(--theme-success-600)" : "var(--theme-error-600)" }}>
          {msg.text}
        </p>
      )}
    </div>
  );
}

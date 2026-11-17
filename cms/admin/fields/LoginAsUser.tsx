"use client";
import { useState } from "react";
import { useAuth, useDocumentInfo } from "@payloadcms/ui";

/** "Log in as this user" on a student's or tutor's page in the admin (admins only). */
export function LoginAsUser() {
  const { id, savedDocumentData } = useDocumentInfo();
  const { user } = useAuth<{ id: number; role?: string }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const role = String(savedDocumentData?.role ?? "");
  if (!id || user?.role !== "admin" || (role !== "student" && role !== "tutor")) return null;

  async function go() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/impersonate", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: id }) }).catch(() => null);
    const d = (await res?.json().catch(() => ({}))) as { redirectTo?: string; error?: string };
    if (res?.ok && d.redirectTo) return window.location.assign(d.redirectTo);
    setBusy(false);
    setError(d.error ?? "That didn't work. Please try again.");
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <button type="button" className="btn btn--style-secondary btn--size-small" onClick={go} disabled={busy} style={{ margin: 0 }}>
        {busy ? "Opening…" : `Log in as this ${role}`}
      </button>
      <p style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.75 }}>See Sabina exactly as they do, for up to an hour. Anything you do is real and is logged. You can&apos;t change their password.</p>
      {error && (
        <p role="alert" style={{ margin: "6px 0 0", fontSize: 13, color: "var(--theme-error-500)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

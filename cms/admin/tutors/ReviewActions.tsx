"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDocumentInfo } from "@payloadcms/ui";

type Action = "approve" | "request_changes" | "reject" | "suspend";

const LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Waiting for review",
  changes_requested: "Changes requested",
  approved: "Approved · live",
  rejected: "Rejected",
  suspended: "Suspended",
};
const TONE: Record<string, string> = { submitted: "warning", changes_requested: "info", approved: "success", rejected: "alert", suspended: "alert", draft: "" };

/** Approve / request changes / reject buttons on a tutor's page in the admin. */
export function ReviewActions() {
  const { id, savedDocumentData, collectionSlug } = useDocumentInfo();
  const router = useRouter();
  const [open, setOpen] = useState<Action | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (collectionSlug !== "tutor-profiles" || !id) return null;
  const status = String(savedDocumentData?.status ?? "draft");
  const slug = savedDocumentData?.slug as string | undefined;

  async function run(action: Action, withNotes = "") {
    setBusy(true);
    setErr("");
    const res = await fetch(`/api/cms/tutor-profiles/${id}/review`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, notes: withNotes }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(d.errors?.[0]?.message ?? d.error ?? "That didn't work.");
    setOpen(null);
    setNotes("");
    router.refresh();
    window.location.reload();
  }

  const can = (a: Action) =>
    ({ approve: ["submitted", "changes_requested", "rejected", "suspended"], request_changes: ["submitted", "approved"], reject: ["submitted", "changes_requested"], suspend: ["approved"] })[a].includes(status);

  return (
    <div className="sb-review">
      <span className={`ep-pill${TONE[status] ? ` ep-pill--${TONE[status]}` : ""}`}>{LABEL[status] ?? status}</span>
      {status === "approved" && slug && (
        <a className="ep-btn ep-btn--ghost ep-btn--sm" href={`/tutors/${slug}`} target="_blank" rel="noopener noreferrer">
          View profile ↗
        </a>
      )}
      {can("approve") && (
        <button type="button" className="ep-btn ep-btn--primary ep-btn--sm" disabled={busy} onClick={() => run("approve")}>
          Approve
        </button>
      )}
      {can("request_changes") && (
        <button type="button" className="ep-btn ep-btn--secondary ep-btn--sm" disabled={busy} onClick={() => setOpen("request_changes")}>
          Request changes
        </button>
      )}
      {can("reject") && (
        <button type="button" className="ep-btn ep-btn--ghost ep-btn--sm sb-review__danger" disabled={busy} onClick={() => setOpen("reject")}>
          Reject
        </button>
      )}
      {can("suspend") && (
        <button type="button" className="ep-btn ep-btn--ghost ep-btn--sm sb-review__danger" disabled={busy} onClick={() => setOpen("suspend")}>
          Suspend
        </button>
      )}
      {err && !open && <span className="sb-review__err">{err}</span>}

      {open && (
        <div className="sb-review__modal" role="dialog" aria-modal="true" aria-label="Message to the tutor">
          <div className="sb-review__box">
            <h3>{open === "request_changes" ? "Request changes" : open === "reject" ? "Reject application" : "Suspend tutor"}</h3>
            <p>
              {open === "reject" ? "Optional message, included in the email to the tutor." : "Tell the tutor exactly what to change. This is emailed to them and shown on their application."}
            </p>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} placeholder="e.g. Please upload a clearer photo of your ID and add your teaching certificate." autoFocus />
            {err && <p className="sb-review__err">{err}</p>}
            <div className="sb-review__row">
              <button type="button" className="ep-btn ep-btn--ghost" onClick={() => setOpen(null)} disabled={busy}>
                Cancel
              </button>
              <button type="button" className={`ep-btn ${open === "request_changes" ? "ep-btn--primary" : "ep-btn--danger"}`} disabled={busy} onClick={() => run(open, notes)}>
                {busy ? "Sending…" : open === "request_changes" ? "Send to tutor" : open === "reject" ? "Reject" : "Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

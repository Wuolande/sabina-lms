"use client";
import { useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";

type Status = { loaded: boolean; tutors: number; students: number; lessons: number; reviews: number; messages: number };
type Step = { step: string; label: string };

async function post(body: object) {
  const res = await fetch("/api/admin/demo", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  const data = (await res?.json().catch(() => null)) as (Status & { error?: string }) | null;
  if (!res?.ok || !data) throw new Error(data?.error ?? "That didn't work. Check your connection and try again.");
  return data;
}

export function DemoPanel({ initial, plan }: { initial: Status; plan: Step[] }) {
  const [s, setS] = useState(initial);
  const [busy, setBusy] = useState<"load" | "remove" | null>(null);
  const [progress, setProgress] = useState<{ at: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = async () => {
    setBusy("load");
    setError(null);
    setNote(null);
    try {
      for (const [i, p] of plan.entries()) {
        setProgress({ at: i, label: p.label });
        setS(await post({ action: "step", step: p.step }));
      }
      setNote("Demo data is loaded. Have a look at the tutors page and the dashboard.");
    } catch (e) {
      setError(`${(e as Error).message} You can remove what was added and try again.`);
    }
    setProgress(null);
    setBusy(null);
  };

  const remove = async () => {
    if (!confirm(`Remove all demo data? This deletes ${s.tutors} demo tutors, ${s.students} demo students and everything attached to them. Real accounts aren't touched.`)) return;
    setBusy("remove");
    setError(null);
    setNote(null);
    try {
      setS(await post({ action: "remove" }));
      setNote("Demo data removed.");
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(null);
  };

  const pct = progress ? Math.round((progress.at / plan.length) * 100) : 0;
  return (
    <section className="ep-card">
      <div className="ep-card__head">
        <div>
          <h3 className="ep-card__title">{s.loaded ? "Demo data is loaded" : "No demo data"}</h3>
          <p className="ep-card__sub">
            {s.loaded
              ? `${s.tutors} tutors, ${s.students} students, ${s.lessons} lessons, ${s.reviews} reviews and ${s.messages} messages.`
              : "Adds 23 tutors with full profiles, 3 tutor applications, 42 students, about six months of lessons, payments, reviews, messages, homework and site visits."}
          </p>
        </div>
        {s.loaded ? (
          <button type="button" className="ep-btn ep-btn--secondary" onClick={remove} disabled={busy !== null}>
            <Trash2 size={15} /> {busy === "remove" ? "Removing…" : "Remove demo data"}
          </button>
        ) : (
          <button type="button" className="ep-btn ep-btn--primary" onClick={load} disabled={busy !== null}>
            <Sparkles size={15} /> {busy === "load" ? "Loading…" : "Load demo data"}
          </button>
        )}
      </div>
      {progress && (
        <div style={{ marginTop: 16 }} role="status" aria-live="polite">
          <div style={{ height: 8, borderRadius: 99, background: "var(--theme-elevation-100)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.max(pct, 4)}%`, background: "var(--sb-brand, #0000FE)", transition: "width .4s" }} />
          </div>
          <p className="ep-card__sub" style={{ marginTop: 8 }}>
            {progress.label}… Keep this page open. It takes a few minutes.
          </p>
        </div>
      )}
      {error && <p style={{ marginTop: 12, color: "var(--theme-error-500)" }}>{error}</p>}
      {note && <p style={{ marginTop: 12 }}>{note}</p>}
      <ul className="ep-card__sub" style={{ marginTop: 16, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Demo accounts use @demo.sabinaedge.com addresses. No emails or texts are sent to them.</li>
        <li>Demo tutors appear on the tutors page, but nobody can pay for a lesson with them.</li>
        <li>To see a demo tutor or student's portal, open their account under Users and use Log in as.</li>
        <li>The reviews are made up, so remove the demo data before you launch.</li>
      </ul>
    </section>
  );
}

"use client";
import { useState } from "react";
import { Check, Copy, Eye, EyeOff, Play, RefreshCw } from "lucide-react";

type Run = { at: string; source: "cron" | "traffic" | "manual"; ok: boolean; ms: number; error?: string } | null;
type Status = { last: Run; lastCron: Run; secret: string | null; secretFromEnv: boolean };

const SOURCE: Record<string, string> = { cron: "your scheduler", traffic: "site activity", manual: "Run now" };
const ago = (iso: string) => {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
};

function CopyField({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [shown, setShown] = useState(!secret);
  const [copied, setCopied] = useState(false);
  return (
    <div className="sb-field">
      <span className="sb-field__label">{label}</span>
      <div className="sb-field__row">
        <code className="sb-field__value">{shown ? value : "•".repeat(Math.min(value.length, 32))}</code>
        {secret && (
          <button type="button" className="ep-btn ep-btn--secondary ep-btn--sm" onClick={() => setShown((s) => !s)} aria-label={shown ? `Hide ${label}` : `Show ${label}`}>
            {shown ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
        <button
          type="button"
          className="ep-btn ep-btn--secondary ep-btn--sm"
          onClick={async () => {
            await navigator.clipboard.writeText(value).catch(() => undefined);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export function JobsPanel({ initial, url }: { initial: Status; url: string }) {
  const [s, setS] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const act = async (action: "run" | "new-key") => {
    if (action === "new-key" && s.secret && !confirm("Make a new key? Your scheduler will stop working until you paste the new key into it.")) return;
    setBusy(action);
    setError(null);
    const res = await fetch("/api/jobs", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (!res?.ok) setError((data as { error?: string } | null)?.error ?? "That didn't work. Check your connection and try again.");
    else setS(data as Status);
    setBusy(null);
  };
  const cronHealthy = s.lastCron && Date.now() - Date.parse(s.lastCron.at) < 30 * 60_000;

  return (
    <div className="sb-jobs">
      <section className="ep-card">
        <div className="ep-card__head">
          <div>
            <h3 className="ep-card__title">Status</h3>
            <p className="ep-card__sub">{cronHealthy ? "Your scheduler is calling the job." : s.lastCron ? "Your scheduler hasn't called in the last 30 minutes." : "No external scheduler has called yet."}</p>
          </div>
          <button type="button" className="ep-btn ep-btn--primary" onClick={() => act("run")} disabled={busy !== null}>
            <Play size={15} /> {busy === "run" ? "Running…" : "Run now"}
          </button>
        </div>
        <dl className="sb-jobs__stats">
          <div>
            <dt>Last run</dt>
            <dd>{s.last ? `${ago(s.last.at)} · ${SOURCE[s.last.source]}` : "Never"}</dd>
          </div>
          <div>
            <dt>Result</dt>
            <dd className={s.last ? (s.last.ok ? "is-ok" : "is-bad") : undefined}>{s.last ? (s.last.ok ? `Worked (${s.last.ms} ms)` : `Failed: ${s.last.error}`) : "–"}</dd>
          </div>
          <div>
            <dt>Last call from your scheduler</dt>
            <dd>{s.lastCron ? ago(s.lastCron.at) : "Never"}</dd>
          </div>
        </dl>
      </section>

      <section className="ep-card">
        <div className="ep-card__head">
          <div>
            <h3 className="ep-card__title">Connection details</h3>
            <p className="ep-card__sub">Your scheduler needs the address and the key. Keep the key private.</p>
          </div>
          {!s.secretFromEnv && (
            <button type="button" className="ep-btn ep-btn--secondary" onClick={() => act("new-key")} disabled={busy !== null}>
              <RefreshCw size={15} /> {s.secret ? "Make a new key" : "Create a key"}
            </button>
          )}
        </div>
        {s.secret ? (
          <>
            <CopyField label="Address" value={url} />
            <CopyField label="Key" value={s.secret} secret />
            <CopyField label="Header (recommended)" value={`Authorization: Bearer ${s.secret}`} secret />
            <CopyField label="Address with key (for schedulers that can't add headers)" value={`${url}?key=${s.secret}`} secret />
            {s.secretFromEnv && <p className="sb-jobs__note">This key comes from CRON_SECRET in your hosting settings. Change it there.</p>}
          </>
        ) : (
          <p className="sb-jobs__note">Create a key first. You can also set CRON_SECRET in your hosting settings, which Vercel&apos;s daily cron uses automatically.</p>
        )}
        {error && (
          <p role="alert" className="sb-jobs__error">
            {error}
          </p>
        )}
      </section>

      <section className="ep-card">
        <h3 className="ep-card__title">Set it up on cron-job.org (free)</h3>
        <ol className="sb-jobs__steps">
          <li>Sign up at cron-job.org and choose <b>Create cronjob</b>.</li>
          <li>Paste the <b>Address</b> above into URL.</li>
          <li>Under Execution schedule, choose <b>Every 10 minutes</b>.</li>
          <li>
            Open <b>Advanced</b>, add a header named <code>Authorization</code> with the value <code>Bearer</code> followed by a space and your key.
          </li>
          <li>Save, then press <b>Test run</b>. The status above should change to “Your scheduler is calling the job”.</li>
        </ol>
        <p className="sb-jobs__note">
          Any scheduler that can call a web address works the same way, for example EasyCron, Upstash QStash, GitHub Actions or a server crontab. If it can&apos;t add headers, use the
          “Address with key” instead. Without a scheduler, the job still runs once a day from Vercel and every few minutes while people use the site.
        </p>
      </section>
    </div>
  );
}

"use client";
import { useCallback, useEffect, useState } from "react";
import { KEYS, type TabName } from "@/cms/integrations/keys";

type Status = {
  keys: Record<string, "admin" | "hosting" | "missing">;
  site: string;
  webhooks: { stripe: string; paystack: string };
  ready: Record<string, boolean>;
  scheduler: { last: { at: string; ok: boolean } | null; lastCron: { at: string } | null; hasKey: boolean } | null;
};

const SOURCE = { admin: "Saved here", hosting: "From hosting settings", missing: "Not set" } as const;
const box: React.CSSProperties = { border: "1px solid var(--ep-line, #e2e8f0)", borderRadius: 14, padding: "14px 16px", margin: "4px 0 22px", background: "var(--ep-surface, #fff)", display: "grid", gap: 10 };
const pill = (ok: boolean): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: ok ? "#dcfce7" : "#fef3c7", color: ok ? "#166534" : "#92400e" });
const muted: React.CSSProperties = { fontSize: 13, color: "var(--ep-ink-2, #475569)", margin: 0 };
const input: React.CSSProperties = { height: 38, borderRadius: 10, border: "1px solid var(--ep-line, #cbd5e1)", padding: "0 12px", minWidth: 0, flex: "1 1 220px", font: "inherit", background: "var(--ep-surface, #fff)", color: "inherit" };
const btn: React.CSSProperties = { height: 38, borderRadius: 10, border: 0, padding: "0 16px", fontWeight: 700, cursor: "pointer", background: "var(--ep-accent-fill, #1800AB)", color: "#fff" };
const when = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "never");

const HEADLINE: Record<string, (s: Status) => [boolean, string]> = {
  website: (s) => [s.ready.website, s.ready.website ? `Live at ${s.site}` : `Using ${s.site}. Add your https:// address when your domain is ready.`],
  email: (s) => [s.ready.email, s.ready.email ? "Email is set up. Send a test to make sure it arrives." : "Email isn't set up, so people can't confirm sign-ups or reset passwords yet."],
  payments: (s) => [s.ready.payments, s.ready.payments ? `Taking payments by ${[s.ready.stripe && "card (Stripe)", s.ready.paystack && "M-Pesa and cards (Paystack)"].filter(Boolean).join(" and ")}.` : "No payment provider yet, so students can't pay for lessons."],
  video: (s) => [s.ready.video, s.ready.video ? "Live lessons use your own LiveKit project." : s.ready.demoVideo ? "Still on LiveKit's free demo server, which isn't for real lessons. Add your own project." : "Live video isn't set up, so lessons can't start."],
  text: (s) => [s.ready.text, s.ready.text ? `Text reminders are on${s.ready.whatsapp ? ", by WhatsApp with SMS as backup" : " by SMS"}.` : "Text reminders are off. Email and in-app reminders still work."],
  push: () => [true, "Push notifications work automatically. These keys are optional."],
};

export function IntegrationPanel({ tab }: { tab: TabName | "scheduler" }) {
  const [s, setS] = useState<Status | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/admin/integrations", { credentials: "include", cache: "no-store" }).catch(() => null);
    if (!res?.ok) return setErr("Couldn't check the status. Reload the page to try again.");
    setS(await res.json());
  }, []);
  useEffect(() => {
    void load();
    const again = () => void load();
    window.addEventListener("focus", again);
    return () => window.removeEventListener("focus", again);
  }, [load]);

  const test = async () => {
    setBusy(true);
    setResult(null);
    const res = await fetch("/api/admin/integrations", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tab, to }) }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { message?: string; error?: string };
    setResult({ ok: Boolean(res?.ok), text: data.message ?? data.error ?? "Something went wrong." });
    setBusy(false);
  };

  if (err) return <div style={box}><p style={muted}>{err}</p></div>;
  if (!s) return <div style={box}><p style={muted}>Checking…</p></div>;

  if (tab === "scheduler") {
    const ok = Boolean(s.scheduler?.lastCron);
    return (
      <div style={box} data-testid="integration-scheduler">
        <span style={pill(ok)}>{ok ? "Running on a schedule" : "Not on a schedule yet"}</span>
        <p style={muted}>
          Last run: {when(s.scheduler?.last?.at)}. Last scheduled run: {when(s.scheduler?.lastCron?.at)}. Until a scheduler is connected, these jobs also run while people use the site.
        </p>
        <p style={muted}>
          Create the scheduler key and copy the address to call on the{" "}
          <a href="/admin/jobs" style={{ fontWeight: 700, color: "var(--ep-accent, #1800AB)" }}>
            Scheduled jobs page
          </a>
          . Free services such as cron-job.org can call it every 15 minutes.
        </p>
      </div>
    );
  }

  const [ok, headline] = HEADLINE[tab]!(s);
  const keys = KEYS.filter((k) => k.tab === tab);
  return (
    <div style={box} data-testid={`integration-${tab}`}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <span style={pill(ok)}>{ok ? "Ready" : "Needs setting up"}</span>
        <p style={{ ...muted, flex: "1 1 260px" }}>{headline}</p>
        <button type="button" onClick={() => void load()} style={{ ...btn, background: "transparent", color: "var(--ep-accent, #1800AB)", padding: "0 8px" }}>
          Check again
        </button>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
        {keys.map((k) => (
          <li key={k.env} style={{ fontSize: 12, color: "var(--ep-ink-2, #475569)" }}>
            {k.label}: <b style={{ color: s.keys[k.env] === "missing" ? "#b45309" : "inherit" }}>{SOURCE[s.keys[k.env] ?? "missing"]}</b>
          </li>
        ))}
      </ul>
      {tab === "payments" && (
        <div style={{ display: "grid", gap: 4 }}>
          <p style={muted}>Webhook addresses to paste into each provider, so payments are confirmed even if a student closes the page:</p>
          <code style={{ fontSize: 12, wordBreak: "break-all" }}>Stripe: {s.webhooks.stripe}</code>
          <code style={{ fontSize: 12, wordBreak: "break-all" }}>Paystack: {s.webhooks.paystack}</code>
        </div>
      )}
      {(tab === "email" || tab === "text") && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <input
            style={input}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            type={tab === "email" ? "email" : "tel"}
            placeholder={tab === "email" ? "Send a test to (email address)" : "Send a test to (phone, e.g. +254 712 345 678)"}
            aria-label={tab === "email" ? "Test email address" : "Test phone number"}
          />
          <button type="button" onClick={() => void test()} disabled={busy || !to.trim()} style={{ ...btn, opacity: busy || !to.trim() ? 0.6 : 1 }}>
            {busy ? "Sending…" : tab === "email" ? "Send test email" : "Send test message"}
          </button>
        </div>
      )}
      {result && (
        <p role="status" style={{ ...muted, color: result.ok ? "#166534" : "#b91c1c", fontWeight: 600 }}>
          {result.text}
        </p>
      )}
      <p style={{ ...muted, fontSize: 12 }}>Save the page after changing a key. Changes apply within a minute, with no redeploy.</p>
    </div>
  );
}

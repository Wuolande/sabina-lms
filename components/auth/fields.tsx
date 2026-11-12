"use client";
import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";

export function Field({ label, hint, error, children, id }: { label: string; hint?: ReactNode; error?: string | null; children: ReactNode; id: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="text-[13px] text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

const inputCls =
  "block w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-[15px] text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/15 disabled:bg-slate-50 aria-[invalid=true]:border-red-400";

export function TextInput({ label, hint, error, ...rest }: { label: string; hint?: ReactNode; error?: string | null } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} id={id}>
      <input id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : undefined} className={inputCls} {...rest} />
    </Field>
  );
}

export function PasswordInput({ label, hint, error, ...rest }: { label: string; hint?: ReactNode; error?: string | null } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <Field label={label} hint={hint} error={error} id={id}>
      <div className="relative">
        <input id={id} type={show ? "text" : "password"} aria-invalid={error ? true : undefined} className={`${inputCls} pr-12`} {...rest} />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:text-brand-700"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </Field>
  );
}

/** Live checklist for the password policy (8+ characters, a letter and a number). */
export function PasswordChecklist({ value }: { value: string }) {
  const rules = [
    { ok: value.length >= 8, label: "8+ characters" },
    { ok: /[a-z]/i.test(value), label: "A letter" },
    { ok: /\d/.test(value), label: "A number" },
  ];
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Password requirements">
      {rules.map((r) => (
        <li key={r.label} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${r.ok ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          <CheckCircle2 size={13} className={r.ok ? "" : "opacity-40"} /> {r.label}
        </li>
      ))}
    </ul>
  );
}

export const passwordOk = (v: string) => v.length >= 8 && /[a-z]/i.test(v) && /\d/.test(v);

export function SubmitButton({ busy, children, busyText }: { busy?: boolean; children: ReactNode; busyText?: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(20,32,156,0.55)] transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:opacity-70"
    >
      {busy && <Loader2 size={18} className="animate-spin" />}
      {busy ? busyText ?? "Please wait…" : children}
    </button>
  );
}

export function Alert({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: ReactNode }) {
  const cls = tone === "error" ? "bg-red-50 text-red-800 ring-red-200" : tone === "success" ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-brand-50 text-brand-900 ring-brand-200";
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex gap-3 rounded-xl p-3.5 text-sm ring-1 ${cls}`}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

/** Hidden anti-bot fields (must stay empty); matches the server's honeypot check. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Company
        <input tabIndex={-1} autoComplete="off" name="_hp_company" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}

export async function postJSON<T = Record<string, unknown>>(url: string, body: unknown): Promise<{ ok: boolean; status: number; data: T & { error?: string } }> {
  try {
    const res = await fetch(url, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "Couldn't reach Sabina. Check your connection and try again." } as T & { error?: string } };
  }
}
